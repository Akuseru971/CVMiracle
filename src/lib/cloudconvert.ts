type CloudConvertTask = {
  id: string;
  name: string;
  result?: {
    files?: Array<{
      filename: string;
      url: string;
    }>;
  };
};

function getCloudConvertHeaders() {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) {
    throw new Error("CLOUDCONVERT_API_KEY manquant");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function convertBufferWithCloudConvert(args: {
  inputBuffer: Buffer;
  inputFormat: string;
  outputFormat: string;
  fileName: string;
}) {
  const base64 = args.inputBuffer.toString("base64");

  const createJob = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: getCloudConvertHeaders(),
    body: JSON.stringify({
      tasks: {
        "import-1": {
          operation: "import/base64",
          file: base64,
          filename: args.fileName,
        },
        "convert-1": {
          operation: "convert",
          input: "import-1",
          input_format: args.inputFormat,
          output_format: args.outputFormat,
        },
        "export-1": {
          operation: "export/url",
          input: "convert-1",
        },
      },
    }),
  });

  if (!createJob.ok) {
    throw new Error("Échec création job CloudConvert");
  }

  const created = (await createJob.json()) as { data: { id: string } };
  const waitResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${created.data.id}/wait`, {
    headers: {
      Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
    },
  });

  if (!waitResponse.ok) {
    throw new Error("Échec attente job CloudConvert");
  }

  const waited = (await waitResponse.json()) as { data: { tasks: CloudConvertTask[] } };
  const exportTask = waited.data.tasks.find((task) => task.name === "export-1");
  const fileUrl = exportTask?.result?.files?.[0]?.url;

  if (!fileUrl) {
    throw new Error("Aucun fichier exporté par CloudConvert");
  }

  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error("Échec téléchargement fichier converti");
  }

  const fileArrayBuffer = await fileResponse.arrayBuffer();
  return Buffer.from(fileArrayBuffer);
}

export async function convertPdfToDocx(pdfBuffer: Buffer) {
  return convertBufferWithCloudConvert({
    inputBuffer: pdfBuffer,
    inputFormat: "pdf",
    outputFormat: "docx",
    fileName: "cv_original.pdf",
  });
}

export async function convertDocxToPdf(docxBuffer: Buffer) {
  return convertBufferWithCloudConvert({
    inputBuffer: docxBuffer,
    inputFormat: "docx",
    outputFormat: "pdf",
    fileName: "cv_optimized.docx",
  });
}
