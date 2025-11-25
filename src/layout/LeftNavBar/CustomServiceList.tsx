import { SessionType } from "@openim/wasm-client-sdk";
import { Modal, List, Avatar, Spin } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import OIMAvatar from "@/components/OIMAvatar";
import { feedbackToast } from "@/utils/common";

// 固定的客服用户ID列表，可以根据实际需求修改
const CUSTOM_SERVICE_USER_IDS = [
    // 这里应该填入实际的客服用户ID
    "5308100819",
    "4136859592",
    "3604454670",
];

const CustomServiceList = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customServiceUsers, setCustomServiceUsers] = useState<any[]>([]);
    const navigate = useNavigate();
    const updateCurrentConversation = useConversationStore((state) => state.updateCurrentConversation);

    const openCustomServiceList = () => {
        setVisible(true);
        fetchCustomServiceUsers();
    };

    const fetchCustomServiceUsers = async () => {
        if (CUSTOM_SERVICE_USER_IDS.length === 0) {
            setCustomServiceUsers([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await IMSDK.getUsersInfo(CUSTOM_SERVICE_USER_IDS);
            setCustomServiceUsers(data);
        } catch (error) {
            feedbackToast({ error, msg: t("toast.getCustomServiceListFailed") });
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (userID: string) => {
        try {
            // 获取会话
            const conversation = (
                await IMSDK.getOneConversation({
                    sourceID: userID,
                    sessionType: SessionType.Single,
                })
            ).data;

            // 更新当前会话
            await updateCurrentConversation(conversation);

            // 关闭模态框并跳转到聊天页面
            setVisible(false);
            navigate(`/chat/${conversation.conversationID}`);
        } catch (error) {
            feedbackToast({ error, msg: t("toast.getConversationFailed") });
        }
    };

    return {
        openCustomServiceList,
        CustomServiceListModal: () => (
            <Modal
                title={t("placeholder.customServiceList")}
                open={visible}
                onCancel={() => setVisible(false)}
                footer={null}
                width={400}
            >
                <Spin spinning={loading}>
                    <List
                        dataSource={customServiceUsers}
                        renderItem={(user: any) => (
                            <List.Item
                                key={user.userID}
                                onClick={() => handleUserClick(user.userID)}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                                <List.Item.Meta
                                    avatar={<OIMAvatar src={user.faceURL} text={user.nickname} size={40} />}
                                    title={user.nickname}
                                    description={user.userID}
                                />
                            </List.Item>
                        )}
                    />
                </Spin>
            </Modal>
        ),
    };
};

export default CustomServiceList;