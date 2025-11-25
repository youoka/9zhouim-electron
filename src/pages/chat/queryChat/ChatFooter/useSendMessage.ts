import { CbEvents, MessageStatus } from "@openim/wasm-client-sdk";
import { MessageItem, WsResponse } from "@openim/wasm-client-sdk/lib/types/entity";
import { SendMsgParams } from "@openim/wasm-client-sdk/lib/types/params";
import { useCallback, useEffect, useRef } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { emit } from "@/utils/events";

import { pushNewMessage, updateOneMessage } from "../useHistoryMessageList";

export type SendMessageParams = Partial<Omit<SendMsgParams, "message">> & {
  message: MessageItem;
  needPush?: boolean;
};

export function useSendMessage() {
  // 用于存储消息ID和客户端ID的映射
  const progressMapRef = useRef<Map<string, string>>(new Map());

  // 清理进度监听器
  useEffect(() => {
    const progressHandler = ({ data }: WsResponse<{ 
      clientMsgID: string; 
      progress: number 
    }>) => {
      const { clientMsgID, progress } = data;
      // 更新消息进度
      updateOneMessage({
        clientMsgID,
        progress,
      } as MessageItem);
    };

    IMSDK.on(CbEvents.OnProgress, progressHandler);
    
    return () => {
      IMSDK.off(CbEvents.OnProgress, progressHandler);
    };
  }, []);

  const sendMessage = useCallback(
    async ({ recvID, groupID, message, needPush }: SendMessageParams) => {
      const currentConversation = useConversationStore.getState().currentConversation;
      const sourceID = recvID || groupID;
      const inCurrentConversation =
        currentConversation?.userID === sourceID ||
        currentConversation?.groupID === sourceID ||
        !sourceID;
      needPush = needPush ?? inCurrentConversation;

      if (needPush) {
        pushNewMessage({ ...message, progress: 0 });
        emit("CHAT_LIST_SCROLL_TO_BOTTOM");
      }

      const options = {
        recvID: recvID ?? currentConversation?.userID ?? "",
        groupID: groupID ?? currentConversation?.groupID ?? "",
        message,
      };

      try {
        const { data: successMessage } = await IMSDK.sendMessage(options);
        updateOneMessage(successMessage);
      } catch (error) {
        updateOneMessage({
          ...message,
          status: MessageStatus.Failed,
        });
      }
    },
    [],
  );

  return {
    sendMessage,
  };
}