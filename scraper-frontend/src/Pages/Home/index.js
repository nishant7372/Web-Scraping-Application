import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import JSONPretty from "react-json-pretty";
import Input from "../../Components/input/Input";
import AnimatedButton from "../../Components/buttons/AnimatedButton";
import ProgressBar from "@ramonak/react-progress-bar";
import Button from "../../Components/buttons/Button";
import "react-json-pretty/themes/monikai.css";

import { io } from "socket.io-client";
import axios from "axios";
import Spinner from "../../Components/loaders/spinner/Spinner";

const Home = () => {
  const [limit, setLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState(null);

  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [socketId, setSocketId] = useState(null);

  const serverurl = "https://coderangers-scraper-backend.onrender.com";
  // const serverurl = "http://localhost:3001";

  useEffect(() => {
    const socket = io(serverurl);
    socket.emit("connected", { message: "Connected Successfully" });
    socket.on("socketId", (res) => {
      setSocketId(res.socketId);
    });

    socket.on("progress", (res) => {
      setProgress(res);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const downloadJson = (jsonData) => {
    if (!jsonData) {
      return;
    }

    // Convert JSON to a string
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Create a Blob
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "data.json");

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrape = async () => {
    try {
      setIsLoading(true);
      setProgress({ completed: 0, total: 0 });
      const res = await axios.get(`${serverurl}/scrape`, {
        params: { limit: limit ? limit : 45, socketId },
      });
      setContent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const convert = (json) => {
    if (
      !Array.isArray(json) ||
      !json.every((p) => typeof p === "object" && p !== null)
    ) {
      return;
    }
    const heading = Object.keys(json[0]).join(",");
    const body = json.map((j) => Object.values(j).join(",")).join("\n");
    return `${heading}\n${body}`;
  };

  const downloadCsv = () => {
    if (!content) {
      return;
    }

    const csv = convert(content?.posts);

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "data.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles["home-page"]}>
      <div className={styles["container"]}>
        <div className={styles["header"]}>
          <Input
            placeholder={"Enter Number of pages to Scrape (Optional)"}
            inputStyle={{ flex: 1, padding: "1rem 2rem", fontSize: "2rem" }}
            type={"number"}
            setState={setLimit}
            value={limit}
            max={45}
            min={1}
          />
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "8rem",
              }}
            >
              <Spinner action={"delete"} />
            </div>
          ) : (
            <AnimatedButton
              content={"Scrape"}
              type={"editBt"}
              buttonStyle={{
                fontSize: "2.2rem",
                width: "8rem",
                textAlign: "center",
                height: "auto",
              }}
              action={scrape}
              disabled={isLoading}
            />
          )}
        </div>
        <ProgressBar
          completed={progress.completed}
          className={`${styles["header"]}`}
          height={"2rem"}
          maxCompleted={progress.total}
          customLabel={`${progress.completed}/${progress.total} Posts Scraped`}
          labelAlignment="center"
          customLabelStyles={{ fontWeight: 400 }}
          bgColor="orangered"
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            width: "95%",
          }}
        >
          <Button
            content={"Download CSV File"}
            type={"saveButton"}
            buttonStyle={{
              width: "100%",
              textAlign: "center",
              fontSize: "2rem",
            }}
            action={downloadCsv}
          />
          <Button
            content={"Download JSON File"}
            type={"customButton"}
            buttonStyle={{
              width: "100%",
              textAlign: "center",
              fontSize: "2rem",
            }}
            action={() => downloadJson(content?.posts)}
          />
        </div>
        <div className={styles["output-container"]}>
          <div>
            {content ? (
              <JSONPretty
                id="json-pretty"
                data={content}
                style={{
                  fontSize: "1.6rem",
                  fontFamily: `Baloo Bhai 2, cursive, sans-serif`,
                  border: "1px solid #999",
                }}
              ></JSONPretty>
            ) : (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.4rem",
                  height: "40rem",
                }}
              >
                Scraped Data will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
