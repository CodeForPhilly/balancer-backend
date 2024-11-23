import { useState, useEffect, useMemo, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentLoadSuccess {
  numPages: number;
}

const PDFViewer = () => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const guid = params.get("guid");

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const pdfUrl = useMemo(
    () => (guid ? `${baseURL}/v1/api/uploadFile/${guid}` : null),
    [guid, baseURL]
  );

  // Memoize PDF options
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
    }),
    []
  );

  // Memoize file object
  const file = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData]);

  const isPDF = useCallback((data: Uint8Array): boolean => {
    if (data.length < 5) return false;
    const header = String.fromCharCode(...data.slice(0, 5));
    return header.startsWith("%PDF-");
  }, []);

  const fetchPdf = useCallback(async () => {
    if (!pdfUrl) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access");
      if (!token) {
        throw new Error("No access token found. Please log in.");
      }

      const response = await axios({
        method: "GET",
        url: pdfUrl,
        headers: {
          Authorization: `JWT ${token}`,
        },
        responseType: "arraybuffer",
      });

      // Create a copy of the array buffer to prevent detachment
      const arrayBuffer = response.data.slice(0);
      const pdfBytes = new Uint8Array(arrayBuffer);

      if (!isPDF(pdfBytes)) {
        throw new Error(
          "Invalid PDF format. The server response does not appear to be a PDF file."
        );
      }

      setPdfData(pdfBytes);
      setLoading(false);
    } catch (err: any) {
      let errorMessage = "An error occurred while fetching the PDF.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          switch (err.response.status) {
            case 401:
              errorMessage = "Session expired. Please log in again.";
              break;
            case 403:
              errorMessage = "You don't have permission to view this document.";
              break;
            case 404:
              errorMessage = "PDF file not found.";
              break;
            case 406:
              errorMessage = "Server cannot generate the requested format.";
              break;
            default:
              errorMessage = `Server error: ${err.response.statusText || "Unknown error"}`;
          }
        } else if (err.request) {
          errorMessage =
            "Unable to reach the server. Please check your connection.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error("PDF fetch error:", err);
      setError(errorMessage);
      setPdfData(null);
      setLoading(false);
    }
  }, [pdfUrl, isPDF]);

  useEffect(() => {
    if (pdfUrl) {
      fetchPdf();
      setPageNumber(1);
    }
  }, [pdfUrl, fetchPdf]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: DocumentLoadSuccess) => {
      setNumPages(numPages);
      setError(null);
    },
    []
  );

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("Document load error:", err);
    setError(err.message);
  }, []);

  if (!guid) {
    return <div className="p-4 text-gray-600">No document specified.</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              ←
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages || "-"}
            </span>
            <button
              onClick={() =>
                setPageNumber((prev) => Math.min(prev + 1, numPages || prev))
              }
              disabled={pageNumber >= (numPages || 1)}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              →
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
            >
              −
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((prev) => Math.min(prev + 0.1, 2.0))}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="border rounded bg-gray-50 p-4 min-h-[600px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-500 text-center p-4">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchPdf}
                  className="mt-2 px-4 py-2 bg-white border rounded hover:bg-gray-50"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {file && !loading && !error && (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
              options={pdfOptions}
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                loading={null}
                error={null}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
