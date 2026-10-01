import { config } from "dotenv";
config({ path: ".env.local" });

import { Document, Packer, Paragraph, TextRun } from "docx";
import { createAdminClient } from "../src/lib/supabase/admin";
import { ingestDocument } from "../src/lib/rag/ingest";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function buildDocxBuffer(title: string, paragraphs: string[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })] }),
          ...paragraphs.map((p) => new Paragraph({ children: [new TextRun(p)], spacing: { before: 200 } })),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

const englishHandbook = {
  storageSlug: "acme-employee-handbook-en.docx",
  filename: "Acme Employee Handbook (English).docx",
  title: "Acme Corp — Employee Handbook (2026)",
  paragraphs: [
    "Vacation Policy: Full-time employees accrue 20 paid vacation days per year, credited monthly. Unused days roll over up to a maximum of 5 days into the next calendar year.",
    "Remote Work Policy: Employees may work remotely up to 3 days per week with manager approval. Fully remote arrangements require VP sign-off.",
    "IT Support: For laptop or software issues, email it-support@acme.example or call extension 4100. Support hours are Monday to Friday, 9am to 6pm.",
    "Expense Reimbursement: Submit expense reports within 30 days of purchase via the Concur portal. Reimbursements over $500 require manager approval.",
  ],
};

const arabicPolicies = {
  storageSlug: "acme-dubai-branch-policies-ar.docx",
  filename: "سياسات فرع دبي (Arabic).docx",
  title: "سياسات فرع دبي - شركة أكمي",
  paragraphs: [
    "سياسة الإجازة السنوية: يحق للموظفين بدوام كامل الحصول على 25 يوم إجازة مدفوعة الأجر سنويًا، بالإضافة إلى العطلات الرسمية في دولة الإمارات العربية المتحدة.",
    "ساعات العمل: من الأحد إلى الخميس، من الساعة 9 صباحًا حتى 6 مساءً، مع استراحة غداء لمدة ساعة واحدة.",
    "التأمين الصحي: توفر أكمي تأمينًا صحيًا شاملاً لجميع الموظفين وعائلاتهم المباشرة اعتبارًا من اليوم الأول للعمل.",
    "التواصل: لأي استفسارات تتعلق بالموارد البشرية، يرجى التواصل عبر hr-dubai@acme.example.",
  ],
};

const romanUrduGuide = {
  storageSlug: "acme-karachi-office-guide-ur.docx",
  filename: "Acme Karachi Office Guide (Roman Urdu).docx",
  title: "Acme Corp Karachi Office Guide",
  paragraphs: [
    "Chutti ki policy: Karachi office ke employees ko saal mein 18 paid chuttiyan milti hain, jo har mahine 1.5 din ke hisaab se accrue hoti hain.",
    "Office timing: Pir se Jumma, subah 9 baje se shaam 5:30 baje tak. Jumma ko namaz ke liye 1 ghanta break milta hai.",
    "Transport allowance: Har employee ko monthly transport allowance milta hai jo salary slip mein alag se show hota hai.",
    "IT masla ho to karachi-it@acme.example par email karein ya reception se contact karein.",
  ],
};

async function main() {
  const admin = createAdminClient();

  const { data: existingOrg, error: findError } = await admin
    .from("organizations")
    .select("id")
    .eq("is_demo", true)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  let orgId = existingOrg?.id as string | undefined;
  if (!orgId) {
    const { data: created, error: createError } = await admin
      .from("organizations")
      .insert({ name: "DocuChat Demo", is_demo: true })
      .select("id")
      .single();
    if (createError || !created) throw new Error(createError?.message || "Failed to create demo org");
    orgId = created.id;
  }

  console.log(`Demo org id: ${orgId}`);
  console.log(`Set DEMO_ORG_ID=${orgId} in your .env.local (and in your deployment env vars).`);

  // Re-seeding is idempotent: wipe any previously seeded demo documents first.
  const { data: existingDocs } = await admin
    .from("documents")
    .select("id, storage_path")
    .eq("org_id", orgId);

  for (const doc of existingDocs ?? []) {
    await admin.storage.from("documents").remove([doc.storage_path]);
  }
  if (existingDocs && existingDocs.length > 0) {
    await admin.from("documents").delete().eq("org_id", orgId);
  }

  const samples = [englishHandbook, arabicPolicies, romanUrduGuide];

  for (const sample of samples) {
    console.log(`\nBuilding ${sample.filename}...`);
    const buffer = await buildDocxBuffer(sample.title, sample.paragraphs);
    const storagePath = `${orgId}/${crypto.randomUUID()}-${sample.storageSlug}`;

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(storagePath, buffer, { contentType: DOCX_MIME });
    if (uploadError) throw new Error(uploadError.message);

    const { data: docRow, error: insertError } = await admin
      .from("documents")
      .insert({
        org_id: orgId,
        filename: sample.filename,
        storage_path: storagePath,
        kind: "docx",
        status: "processing",
      })
      .select("id")
      .single();
    if (insertError || !docRow) throw new Error(insertError?.message || "Insert failed");

    console.log(`Processing ${sample.filename}...`);
    await ingestDocument(docRow.id);
    console.log(`Done: ${sample.filename}`);
  }

  console.log("\nDemo seeding complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
