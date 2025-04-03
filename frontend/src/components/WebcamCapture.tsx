import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import ImageUploader from "./ImageUploader";
import "../index.css";

const WebcamCapture: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [classifier, setClassifier] =
    useState<knnClassifier.KNNClassifier | null>(null);
  const [currentClass, setCurrentClass] = useState<string>("");
  const [prediction, setPrediction] = useState<string>("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [uploadBtn, setUploadBtn] = useState(false);

  console.log("Current Prediction:", prediction);

  // ✅ Initialize model and load saved images
  useEffect(() => {
    const loadClassifier = async () => {
      const knn = knnClassifier.create();
      setClassifier(knn);

      try {
        // ✅ Load saved images for retraining
        const response = await axios.get("http://localhost:5000/get-images");
        const images = response.data.images;

        for (const img of images) {
          const imageData = await loadImage(
            `http://localhost:5000/saved_images/${img}`
          );
          const tensor = tf.browser
            .fromPixels(imageData)
            .toFloat()
            .div(tf.scalar(255));

          // ✅ Extract class name properly from "className_1.png"
          const className = img.split("_")[0];

          // ✅ Add multiple examples without clearing
          knn.addExample(tensor, className);
          tensor.dispose(); // Clean up tensor after adding
        }

        console.log("✅ Images loaded successfully!");
      } catch (error) {
        console.error("❌ Error loading images:", error);
      }
    };

    loadClassifier();
  }, [prediction,currentClass]);

  // ✅ Capture and save image for training
  const captureAndSave = async () => {
    if (webcamRef.current && classifier && currentClass !== "") {
      const imageSrc: string | null = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        alert("⚠️ Failed to capture image.");
        return;
      }

      const tensor = await getImageTensor(imageSrc);

      // ✅ Add example to classifier
      classifier.addExample(tensor, currentClass);
      console.log(`✅ Added example for class: ${currentClass}`);
      console.log("Class Example Counts:", classifier.getClassExampleCount());

      // ✅ Send image to backend for storage
      await axios.post("http://localhost:5000/save-image", {
        image: imageSrc,
        className: currentClass,
      });

      alert(`✅ Image saved and classified as "${currentClass}" successfully!`);
    } else {
      alert("⚠️ Please enter a class name before capturing.");
    }
  };

  // ✅ Load image from URL and return as HTMLImageElement
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  };

  // ✅ Get image tensor properly
  const getImageTensor = async (imageSrc: string): Promise<tf.Tensor> => {
    return new Promise<tf.Tensor>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.onload = () => {
        if (img.width === 0 || img.height === 0) {
          reject("Error: Image has invalid dimensions.");
          return;
        }
        // ✅ Normalize tensor values between 0 and 1
        const tensor = tf.browser.fromPixels(img).toFloat().div(tf.scalar(255));
        resolve(tensor);
      };
      img.onerror = (error) => reject(error);
    });
  };

  // ✅ Predict class from current frame
  const predictClass = async () => {
    if (webcamRef.current && classifier) {
      const imageSrc: string | null = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        alert("⚠️ Failed to capture image for prediction.");
        return;
      }

      const tensor = await getImageTensor(imageSrc);
      console.log("Captured Tensor:", tensor);

      // ✅ Check if classifier has any examples
      if (classifier.getNumClasses() > 0) {
        const result = await classifier.predictClass(tensor);
        console.log("Prediction Result:", result);

        if (result.label) {
          setPrediction(result.label);
        } else {
          setPrediction("❌ Unknown class");
        }
      } else {
        setPrediction("⚠️ No classes available. Add examples first.");
      }

      tensor.dispose(); // Dispose tensor after prediction
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Teachable Machine</h1>
      <div
        style={{
          width: 641,
          height: 481,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <button
          onClick={() => setIsCameraOn((prev) => !prev)}
          style={{
            margin: "10px",
            padding: "10px 20px",
            backgroundColor: `${isCameraOn ? "#4CAF50" : "#f44336"}`,
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {isCameraOn ? "🔴 Turn Off Camera" : "🟢 Turn On Camera"}
        </button>
        <div
          style={{
            border: `${isCameraOn ? "2px solid #4CAF50" : "2px solid red"}`,
            borderRadius: "5%",
            width: 640,
            height: 480,
          }}
        >
          {isCameraOn && (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/png"
              width={640}
              height={480}
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
              style={{ borderRadius: "5%" }}
            />
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {!uploadBtn && (
          <div
            style={{
              textAlign: "center",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h3 style={{ color: "white" }}>
              Prediction:{" "}
              <span
                style={{
                  color:
                    !isCameraOn || uploadBtn
                      ? "white"
                      : prediction === "No Prediction Yet"
                      ? "#FF5722"
                      : "#4CAF50",
                }}
              >
                {prediction || "No Prediction Yet"}
              </span>
            </h3>
            <br />
            <input
              type="text"
              placeholder="Enter Class Name"
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
              style={{ margin: "10px", padding: "5px", width: "250px" }}
              disabled={isCameraOn ? false : true}
            />
            <br />
            <button
              onClick={captureAndSave}
              style={{
                margin: "10px",
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              disabled={isCameraOn ? false : true}
            >
              📸 Capture & Save
            </button>
            <button
              onClick={predictClass}
              style={{
                margin: "10px",
                padding: "10px 20px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              disabled={isCameraOn ? false : true}
            >
              🔍 Predict
            </button>
            {!uploadBtn && (
              <button onClick={() => setUploadBtn(true)}>Upload</button>
            )}
          </div>
        )}
        <div>
          <ImageUploader uploadBtn={uploadBtn} setUploadBtn={setUploadBtn} />
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
