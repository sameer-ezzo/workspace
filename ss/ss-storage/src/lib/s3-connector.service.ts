// import { Inject, Injectable } from "@nestjs/common";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { FileInfo } from "@noah-ark/common";
// import { join } from "path";
// const fs = require("fs");
// const path = require("path");

// export class S3Options {
//     constructor(
//         readonly accountId = process.env["S3_CONFIG"] || undefined,
//         // The Access Key ID for your R2 API token.
//         readonly accessKeyId = process.env["ACCESS_KEY_ID"] || undefined, //"YOUR_R2_ACCESS_KEY_ID",
//         // The Secret Access Key for your R2 API token.
//         readonly secretAccessKey = process.env["SECRET_ACCESS_KEY"] || undefined, //"YOUR_R2_SECRET_ACCESS_KEY",
//         readonly publicUrl = process.env["PUBLIC_URL"] || undefined,
//     ) {}
// }

// export class S3AuthOptions {
//     constructor(
//         readonly region = process.env["REGION"] || "auto",
//         readonly endpoint = process.env["ENDPOINT"] || undefined, //"YOUR_R2_ACCESS_KEY_ID",
//         readonly accessKeyId = process.env["ACCESS_KEY_ID"] || undefined, //"your-bucket-name",
//         readonly secretAccessKey = process.env["SECRET_ACCESS_KEY"] || undefined, //path.join(__dirname, "file-to-upload.txt"),
//         // The public URL of your R2 bucket. Enable public access in your bucket's settings to use this.
//         // The format is typically: https://pub-xxxxxxxx.r2.dev
//         readonly public_bucket_url = process.env["public_bucket_url"] || undefined, //"YOUR_PUBLIC_BUCKET_URL",
//     ) {}
// }

// @Injectable()
// export class S3ConnectorService {
//     private s3Client: S3Client;
//     constructor(
//         @Inject("S3_AUTH_OPTIONS") private readonly authOptions: S3AuthOptions,
//         @Inject("S3_OPTIONS") private readonly options: S3Options,
//     ) {
//         this.s3Client = new S3Client(this.authOptions);
//     }

//     uploadFileInfo(file: FileInfo, base: string = process.env["STORAGE_DIR"]) {
//         const path = (base = (base ?? "").trim()).length ? join(base, file.path) : join(__dirname, file.path);
//         return this.uploadFile(path, file._id, file.filename, this.options.publicUrl);
//     }
//     uploadFile = async (
//         filePath: string,
//         // The name of the R2 bucket you want to upload the file to.
//         bucketName: string,
//         // The name you want the file to have in the R2 bucket.
//         fileKey: string, //"my-uploaded-file.txt",
//         publicBucketUrl: string,
//         // The path to the local file you want to upload.
//         // readonly file_path = process.env["file_path"] || undefined, //path.join(__dirname, "file-to-upload.txt"),
//         // The public URL of your R2 bucket. Enable public access in your bucket's settings to use this.
//         // The format is typically: https://pub-xxxxxxxx.r2.dev
//         // readonly public_bucket_url = process.env["public_bucket_url"] || undefined, //"YOUR_PUBLIC_BUCKET_URL",
//     ) => {
//         if (!fs.existsSync(filePath)) {
//             console.error(`Error: The file at ${filePath} was not found.`);
//             // Create a dummy file for demonstration purposes if it doesn't exist.
//             console.log("Creating a dummy file named 'file-to-upload.txt' for this example.");
//             fs.writeFileSync(filePath, "This is a test file for Cloudflare R2 upload.");
//         }

//         // Read the file content into a stream.
//         const fileStream = fs.createReadStream(filePath);

//         // Prepare the command for the upload operation.
//         const putObjectCommand = new PutObjectCommand({
//             Bucket: bucketName,
//             Key: fileKey,
//             Body: fileStream,
//             // You can optionally set the ContentType to help browsers handle the file correctly.
//             // ContentType: "text/plain",
//         });

//         try {
//             // Execute the upload command.
//             console.log(`Uploading ${fileKey} to bucket ${bucketName}...`);
//             const response = await this.s3Client.send(putObjectCommand);
//             console.log("File uploaded successfully!");

//             // Log the response from R2 for debugging or verification.
//             console.log("R2 Response:", response);

//             // Construct and log the public URL of the uploaded file.
//             // This requires your bucket to be configured for public access.
//             if (publicBucketUrl) {
//                 const publicUrl = `${publicBucketUrl}/${fileKey}`;
//                 console.log("\n✅ Success! Your file is available at the public URL:");
//                 console.log(publicUrl);
//             } else {
//                 console.warn("\n⚠️ Public bucket URL is not configured. Cannot generate public link.");
//                 console.log("To get a public link, enable public access for your bucket in the Cloudflare R2 settings and set the PUBLIC_BUCKET_URL variable.");
//             }
//         } catch (error) {
//             // Catch and log any errors during the upload process.
//             console.error("An error occurred during upload:", error);
//         }
//     };

//     // --- Execute the Script ---
//     // Run the main upload function.
//     // uploadFile();
// }
