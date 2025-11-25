import { DownloadOutlined, FileOutlined } from "@ant-design/icons";
import { MessageStatus } from "@openim/wasm-client-sdk";
import { Progress, Spin, Tooltip } from "antd";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";
import { bytesToSize } from "@/utils/common";

const FileMessageRender: FC<IMessageItemProps> = ({ message }) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const fileElem = message.fileElem;
  const isSending = message.status === MessageStatus.Sending;
  
  const handleDownload = async () => {
    if (!fileElem?.sourceUrl) return;
    
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const response = await fetch(fileElem.sourceUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength || '0', 10);
      let loaded = 0;
      
      const reader = response.body?.getReader();
      const chunks = [];
      
      if (!reader) {
        // Fallback if ReadableStream is not supported
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileElem.fileName || "file";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total) {
          const progress = Math.floor((loaded / total) * 100);
          setDownloadProgress(progress);
        }
      }
      
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileElem.fileName || "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <div className={styles.bubble}>
      <Spin spinning={isSending || downloading}>
        <div 
          className="flex items-center cursor-pointer min-w-[200px]"
          onClick={handleDownload}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded bg-[var(--primary-active)]">
            <FileOutlined className="text-[var(--primary)]" />
          </div>
          <div className="ml-2 flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{fileElem?.fileName}</div>
            <div className="text-xs text-[var(--sub-text)]">
              {fileElem?.fileSize && bytesToSize(fileElem.fileSize)}
            </div>
            {isSending && typeof message.progress === 'number' && (
              <div className="w-full mt-1">
                <Progress percent={Math.round(message.progress * 100)} size="small" />
              </div>
            )}
            {downloading && (
              <div className="w-full mt-1">
                <Progress percent={downloadProgress} size="small" />
              </div>
            )}
          </div>
          <Tooltip title={t("placeholder.finder")}>
            <DownloadOutlined 
              className="text-[var(--sub-text)] ml-2" 
            />
          </Tooltip>
        </div>
      </Spin>
    </div>
  );
};

export default FileMessageRender;