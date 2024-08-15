//import Welcome from "../../components/Welcome/Welcome.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../Layout/Layout";
// import { Link } from "react-router-dom";

interface File {
  id: number;
  guid: string;
  file_name: string;
  date_of_upload: string;
  size: number;
  page_count: number;
  file_type: string;
  uploaded_by_email: string;
  source_url: string | null;
  analyzed: boolean | null;
  approved: boolean | null;
  uploaded_by: number;
}
function ListOfFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  //   const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`${baseUrl}/v1/api/uploadFile`, {
          headers: {
            Authorization: `JWT ${localStorage.getItem("access")}`, // Assuming JWT is used for auth
          },
        });
        console.log("Response data:", response.data);
        if (Array.isArray(response.data)) {
          setFiles(response.data);
        } else {
          //   setError("Unexpected response format");
        }
      } catch (error) {
        console.error("Error fetching files", error);
        // setError("Error fetching files");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Layout>
      <div className="font_body mt-48 flex w-full flex-col items-center justify-center rounded-md border bg-white p-4 px-8 ring-1 hover:ring-slate-300 md:max-w-6xl">
        <div className="mt-8 text-sm text-gray-600">
          <ul>
            {files.map((file) => (
              <li key={file.id} className="border-b p-4">
                <p>
                  <strong>File Name:</strong> {file.file_name}
                </p>
                <p>
                  <strong>Date of Upload:</strong>{" "}
                  {new Date(file.date_of_upload).toLocaleString()}
                </p>
                <p>
                  <strong>Size:</strong> {file.size} bytes
                </p>
                <p>
                  <strong>Page Count:</strong> {file.page_count}
                </p>
                <p>
                  <strong>File Type:</strong> {file.file_type}
                </p>
                <p>
                  <strong>Uploaded By:</strong> {file.uploaded_by_email}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default ListOfFiles;
