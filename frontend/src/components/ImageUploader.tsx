// import React, { useState } from "react";
// import axios from "axios";

// const ImageUploader: React.FC = () => {
//   const [file, setFile] = useState<File | null>(null);

//   const handleUpload = async () => {
//     if (file) {
//       const formData = new FormData();
//       formData.append("image", file);
//       await axios.post("http://localhost:5000/save-image", formData);
//       alert("Image uploaded successfully!");
//     }
//   };

//   return (
//     <div>
//       <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
//       <button onClick={handleUpload}>Upload Image</button>
//     </div>
//   );
// };

// export default ImageUploader;


import React, { useState } from "react";
import axios from "axios";

interface ImageUploader {
  uploadBtn: boolean;
  setUploadBtn: React.Dispatch<React.SetStateAction<boolean>>;
}

const ImageUploader: React.FC<ImageUploader> = ({uploadBtn,setUploadBtn}) => {
  const [file, setFile] = useState<File | null>(null);
  const [className, setClassName] = useState<string>("");

  // ✅ Convert file to base64
  const convertToBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ Upload base64 image to Flask
  const handleUpload = async () => {
    setUploadBtn(false)
    if (file && className.trim() !== "") {
      try {
        const base64Image = await convertToBase64(file);
        
        const imageData = {
          image: base64Image,
          className: className,
        };

        // ✅ Send as application/json
        const response = await axios.post("http://localhost:5000/save-image", imageData, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        alert(`Image uploaded successfully: ${response.data.file_name}`);
        console.log(response.data);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image.");
      }
    } else {
      alert("Please select a file and enter a class name.");
    }
  };

  return (
    
    <div style={{ textAlign: "center", marginTop: "75px" }}>
      {uploadBtn && <>
        <h2 style={{ marginBottom: "20px" }}>Upload Image with Class Name To Train the modal using Images</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{
          padding: "10px",
          marginBottom: "10px",
        }}
      />
      <br />

      <input
        type="text"
        placeholder="Enter Class Name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        style={{
          padding: "10px",
          width: "60%",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
        }}
      />
      <br />

      <button
        onClick={handleUpload}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
      >
        Upload Image
      </button>
      </>
     
      
      }
      
    </div>
  );
};

export default ImageUploader;
