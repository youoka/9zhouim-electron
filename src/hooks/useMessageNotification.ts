import { MessageItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useEffect, useRef } from "react";

import { useUserStore } from "@/store";

// 创建音频上下文用于播放提示音
const useMessageNotification = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const selfInfo = useUserStore(state => state.selfInfo);

  // 初始化音频上下文
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      // @ts-ignore
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  // 播放提示音
  const playNotificationSound = () => {
    try {
      initAudioContext();
      const audioContext = audioContextRef.current;
      
      if (!audioContext) return;
      
      // 创建简单的提示音（蜂鸣声）
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // 0.2秒后停止播放
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (error) {
      console.warn('无法播放提示音:', error);
    }
  };

  // 显示系统通知
  const showSystemNotification = (message: MessageItem) => {
    // 检查是否支持桌面通知
    if (!("Notification" in window)) {
      console.warn("此浏览器不支持桌面通知");
      return;
    }

    // 请求通知权限
    if (Notification.permission === "granted") {
      createNotification(message);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          createNotification(message);
        }
      });
    }
  };

  // 创建通知
  const createNotification = (message: MessageItem) => {
    // 不要为自己发送的消息显示通知
    if (message.sendID === selfInfo.userID) {
      return;
    }

    const title = message.senderNickname || "新消息";
    const options: NotificationOptions = {
      body: getMessagePreview(message),
      icon: message.senderFaceUrl || undefined,
      timestamp: Number(message.sendTime) * 1000, // 转换为毫秒
    };

    // 在 Electron 环境中使用 Electron API 显示通知
    if (window.electronAPI) {
      try {
        // @ts-ignore
        const myNotification = new window.Notification(title, options);
        myNotification.onclick = () => {
          window.focus();
          myNotification.close();
        };
      } catch (error) {
        // Electron 环境中降级到使用 Web Notification API
        fallbackToWebNotification(title, options);
      }
    } else {
      // 在 Web 环境中使用标准 Web Notification API
      const notification = new Notification(title, options);
      
      // 点击通知时的处理
      notification.onclick = () => {
        // 可以在这里添加点击通知后的操作，比如聚焦到聊天窗口
        window.focus();
        notification.close();
      };
    }
  };

  // 降级到 Web Notification API
  const fallbackToWebNotification = (title: string, options: NotificationOptions) => {
    try {
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.warn('无法创建桌面通知:', error);
    }
  };

  // 获取消息预览文本
  const getMessagePreview = (message: MessageItem): string => {
    switch (message.contentType) {
      case 101: // 文本消息
        return message.textElem?.content || "文本消息";
      case 102: // 图片消息
        return "[图片]";
      case 103: // 语音消息
        return "[语音]";
      case 104: // 视频消息
        return "[视频]";
      case 105: // 文件消息
        return `[文件] ${message.fileElem?.fileName || ""}`;
      case 106: // 地址位置消息
        return "[位置]";
      case 107: // 名片消息
        return "[名片]";
      case 108: // 合并消息
        return "[聊天记录]";
      default:
        return "新消息";
    }
  };

  // 处理新消息通知
  const handleNewMessageNotification = (message: MessageItem) => {
    // 不要为自己发送的消息显示通知
    if (message.sendID === selfInfo.userID) {
      return;
    }

    // 播放提示音
    playNotificationSound();
    
    // 显示系统通知
    showSystemNotification(message);
  };

  return {
    handleNewMessageNotification,
  };
};

export default useMessageNotification;