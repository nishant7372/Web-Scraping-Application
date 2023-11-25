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

const Home = () => {
  const [limit, setLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState(null);

  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const socket = io("https://coderangers-scraper-backend.onrender.com");
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

  const scrape = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        "https://coderangers-scraper-backend.onrender.com/scrape",
        {
          params: { limit: limit ? limit : 45, socketId },
        }
      );
      console.log(res);
      setContent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
        </div>
        <ProgressBar
          completed={progress.completed}
          className={styles["header"]}
          height={"2rem"}
          maxCompleted={progress.total}
          customLabel={`${progress.completed}/${progress.total} Posts Scraped`}
          labelAlignment="center"
          customLabelStyles={{ fontWeight: 400 }}
        />
        <Button
          content={"Download CSV File"}
          type={"saveButton"}
          buttonStyle={{ width: "94%", textAlign: "center", fontSize: "2rem" }}
        />
        <div className={styles["output-container"]}>
          <div data-color-mode="dark">
            <JSONPretty
              id="json-pretty"
              data={content}
              style={{
                fontSize: "1.6rem",
                fontFamily: `Baloo Bhai 2, cursive, sans-serif`,
                border: "1px solid #999",
              }}
            ></JSONPretty>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
