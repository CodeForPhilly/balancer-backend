import React from "react";
// import { Link } from "react-router-dom";
import "../../components/Header/chat.css";
import { useState, useEffect, useRef } from "react";
import TypingAnimation from "./components/TypingAnimation";
import chatBubble from "../../assets/chatbubble.svg";
import { extractContentFromDOM } from "../../services/domExtraction";
import {
  fetchConversations,
  continueConversation,
  newConversation,
  updateConversationTitle,
} from "../../api/apiClient";
import ErrorMessage from "../ErrorMessage";

interface ChatLogItem {
  is_user: boolean;
  content: string;
  // date: Date;
}

export interface Conversation {
  title: string;
  messages: ChatLogItem[];
  id: string;
}

interface ChatDropDownProps {
  showChat: boolean;
  setShowChat: React.Dispatch<React.SetStateAction<boolean>>;
}

const Chat: React.FC<ChatDropDownProps> = ({ showChat, setShowChat }) => {
  const [inputValue, setInputValue] = useState("");
  const [chatLog, setChatLog] = useState<ChatLogItem[]>([]); // Specify the type as ChatLogItem[]
  const [isLoading, setIsLoading] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const suggestionPrompts = [
    "Tell me about treatment options.",
    "What are the common side effects?",
    "How to manage medication schedule?",
  ];
  const [pageContent, setPageContent] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const content = extractContentFromDOM();
      setPageContent(content);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const extractedContent = extractContentFromDOM();
    // console.log(extractedContent);
    setPageContent(extractedContent);
  }, []);

  // useEffect(() => {
  //   const chatContainer = document.getElementById("chat_container");
  //   if (chatContainer && showChat) {
  //     chatContainer.scrollTop = chatContainer.scrollHeight;
  //   }
  // }, [showChat, chatLog]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatLog]);

  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
      // setLoading(false);
    } catch (error) {
      console.error("Error loading conversations: ", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newMessage = {
      content: inputValue,
      is_user: true,
    };

    const newMessages = [...chatLog, newMessage];

    setChatLog(newMessages);

    // sendMessage(newMessages);
    try {
      let conversation = activeConversation;
      let conversationCreated = false;

      // Create a new conversation if none exists
      if (!conversation) {
        conversation = await newConversation();
        setActiveConversation(conversation);
        conversationCreated = true;
      }

      // Update the conversation with the new user message
      const updatedMessages = [...conversation.messages, newMessage];
      setActiveConversation({
        ...conversation,
        messages: updatedMessages,
      });

      setIsLoading(true);

      // Continue the conversation and update with the bot's response
      const data = await continueConversation(
        conversation.id,
        newMessage.content,
        pageContent,
      );

      // Update the ConversationList component after previous function creates a title
      if (conversationCreated) loadConversations(); // Note: no 'await' so this can occur in the background

      setActiveConversation((prevConversation) => {
        if (!prevConversation) return null;

        return {
          ...prevConversation,
          messages: [
            ...prevConversation.messages,
            { is_user: false, content: data.response },
          ],
        };
      });
      setError(null);
    } catch (error) {
      console.error("Error(s) handling conversation:", error);
      if (error instanceof Error) {
        setError(error); // Set the error message if it's an instance of Error
      } else {
        setError(new Error("Error submitting message")); // Convert any other types to string
      }
    } finally {
      setIsLoading(false);
      setInputValue("");
    }
  };

  // const systemMessage = {
  //   role: "system",
  //   content: "You are a bot please keep conversation going.",
  // };
  // const sendMessage = (message: ChatLogItem[]) => {
  //   const baseUrl = import.meta.env.VITE_API_BASE_URL;
  //   const url = `${baseUrl}/chatgpt/chat`;

  //   const apiMessages = message.map((messageObject) => {
  //     let role = "";
  //     if (messageObject.is_user) {
  //       role = "user";
  //     } else {
  //       role = "assistant";
  //     }
  //     return { role: role, content: messageObject.content };
  //   });

  //   systemMessage.content += `If applicable, please use the following content to ask questions. If not applicable,
  //     please answer to the best of your ability: ${pageContent}`;

  //   const apiRequestBody = {
  //     prompt: [systemMessage, ...apiMessages],
  //   };

  //   setIsLoading(true);

  //   axios
  //     .post(url, apiRequestBody)
  //     .then((response) => {
  //       console.log(response);
  //       setChatLog((prevChatLog) => [
  //         ...prevChatLog,
  //         {
  //           is_user: false,
  //           content: response.data.message.choices[0].message.content,
  //         },
  //       ]);
  //       setIsLoading(false);
  //     })
  //     .catch((error) => {
  //       setIsLoading(false);
  //       console.log(error);
  //     });
  // };

  const handleSelectConversation = (id: Conversation["id"]) => {
    const selectedConversation = conversations.find(
      (conversation) => conversation.id === id,
    );

    if (selectedConversation) {
      setActiveConversation(selectedConversation);
      setShowConversationList(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setShowConversationList(false);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <>
      {/* {showChat && (
        <div
          className="fixed inset-0 bg-gray-900 opacity-50 z-5"
          onClick={handleChat}
        ></div>
      )} */}
      <div
        className={`fixed bottom-0 right-0 rounded md:bottom-3 md:right-4 ${
          showChat ? "show_chat border-1bg-white ring-slate-1000/10" : "h-12 "
        } shadow `}
      >
        {showChat ? (
          <div
            ref={chatContainerRef}
            id="chat_container"
            className=" mx-auto flex h-full  flex-col overflow-auto rounded "
          >
            <div
              className="mt-0 flex h-8 w-full flex-row items-center justify-between rounded-t-lg border-b bg-white p-1  "
              style={{ borderBottomColor: "#abcdef" }}
            >
              <button
                onClick={() =>
                  setShowConversationList((prevState) => !prevState)
                }
              >
                {showConversationList ? "Hide" : "Show"}
              </button>
              <div className=" ml-4  text-black">
                Question for me? <br />
              </div>
              <div
                className="delete mr-2 flex h-6 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-black hover:bg-red-500"
                onClick={() => setShowChat(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.293 4.293a1 1 0 011.414 1.414L11.414 12l5.293 5.293a1 1 0 01-1.414 1.414L10 13.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 12 3.293 6.707a1 1 0 111.414-1.414L10 10.586l5.293-5.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            {showConversationList ? (
              <ConversationList
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onSubmitConversationTitle={updateConversationTitle}
              />
            ) : (
              <div className="font_body mt-6 flex flex-grow flex-col space-y-2 p-5 pb-44">
                {activeConversation === null ||
                activeConversation.messages.length === 0 ? (
                  <>
                    {/* <div className="text-gray-500">
                    Want to know more about a medication or have a question? Ask
                    Balancer in this chat, and information will be pulled from
                    all over the internet to assist you <br />
                    <br />
                  </div> */}
                    <div className="max-h-[100%] max-w-[310px] rounded-lg border-2 bg-gray-200 p-2 text-black">
                      You can ask about the content on this page.
                    </div>
                    <div className="max-h-[100%] max-w-[190px] rounded-lg border-2 bg-gray-200 p-2 text-black">
                      Or questions in general.
                    </div>
                  </>
                ) : (
                  activeConversation.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.is_user ? "justify-end" : "justify-start"
                      }`}
                    >
                      <pre
                        style={{
                          fontFamily: "inherit",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                        className={`${
                          message.is_user
                            ? "bg-blue-200 text-black "
                            : "border-2 bg-gray-200 text-black "
                        }rounded-lg max-h-[100%] max-w-[500px] p-2`}
                        dangerouslySetInnerHTML={{
                          __html: message.content,
                        }}
                      ></pre>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div key={chatLog.length} className="flex justify-between">
                    <div className="max-w-sm rounded-lg p-4 text-white">
                      <TypingAnimation />
                    </div>
                  </div>
                )}
                {error && <ErrorMessage errors={[error.message]} />}
              </div>
            )}
            <div className="inside_chat bottom-0 left-0 right-0 rounded-b-lg bg-white p-4">
              <div className="flex  space-x-2 p-2 ">
                {suggestionPrompts.map((suggestion, index) => (
                  <button
                    type="button"
                    key={index}
                    className="rounded-md border p-2 text-sm text-black hover:bg-blue-200"
                    onClick={() => setInputValue(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="mb-1 flex">
                <div className="ml-2 flex-grow">
                  <input
                    type="ani_input"
                    className="input w-full"
                    placeholder="Talk to me..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <div className="ml-5">
                  <button type="submit" className="btnBlue">
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowChat(true)}
            className="  absolute bottom-9 right-5 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full   object-contain hover:cursor-pointer hover:border-blue-600 hover:bg-blue-300 md:bottom-20 md:right-20 "
          >
            <img src={chatBubble} alt="logo" className="h-6 md:h-10 md:w-10 " />
          </div>
        )}
      </div>
    </>
  );
};

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: Conversation["id"]) => void;
  onNewConversation: () => void;
  onSubmitConversationTitle: (
    conversationId: Conversation["id"],
    newTitle: string,
  ) => Promise<
    { status: string; title: Conversation["title"] } | { error: string }
  >;
}
const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onSubmitConversationTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState<
    Conversation["id"] | null
  >(null); // Track which conversation is being edited
  const [newTitle, setNewTitle] = useState("");
  const [localConversations, setLocalConversations] = useState(conversations);

  // Ensure that the local conversations state is updated when the prop changes
  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const handleTitleSubmit = async (
    conversationId: Conversation["id"],
    newTitle: string,
  ) => {
    try {
      const result = await onSubmitConversationTitle(conversationId, newTitle);

      if ("status" in result) {
        // Handle success case
        setLocalConversations(
          localConversations.map((convo) =>
            convo.id === conversationId
              ? { ...convo, title: result.title }
              : convo,
          ),
        );
      } else if ("error" in result) {
        // Handle error case
        console.error("Failed to update conversation title:", result.error);
      }
    } catch (error) {
      console.error("Error updating conversation title: ", error);
    } finally {
      setIsEditingTitle(null);
    }
  };

  return (
    <>
      <button className="btnBlue m-4 text-lg" onClick={onNewConversation}>
        New Conversation
      </button>
      <ul className="conversation-list space-y-4">
        {localConversations.map((conversation) => (
          <li
            key={conversation.id}
            className="conversation-item flex justify-between items-center p-4 bg-white shadow rounded-lg hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              // Conversation can only be selected while not editing the title
              if (isEditingTitle !== conversation.id) {
                onSelectConversation(conversation.id);
              }
            }}
          >
            <span onClick={() => setIsEditingTitle(conversation.id)}>
              {isEditingTitle === conversation.id ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleSubmit(conversation.id, newTitle);
                    }
                  }}
                  autoFocus
                />
              ) : (
                conversation.title
              )}
            </span>

            <div className="flex space-x-2">
              {/* Edit Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 cursor-pointer"
                viewBox="0 0 20 20"
                fill="currentColor"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the click event from bubbling up to the <li> element

                  if (isEditingTitle !== conversation.id) {
                    setNewTitle(conversation.title);
                    setIsEditingTitle(conversation.id);
                  } else handleTitleSubmit(conversation.id, newTitle);
                }}
              >
                <path d="M17.414 2.586a2 2 0 010 2.828l-9.586 9.586a1 1 0 01-.293.207l-4 2a1 1 0 01-1.37-1.37l2-4a1 1 0 01.207-.293l9.586-9.586a2 2 0 012.828 0zM15.707 4L13 6.707 7.707 1.414 10.414 4H15.707zM3 12.414L8.293 7.121 12.879 11.707 7.586 17H4v-3.586l-.293-.293L3 12.414z" />
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default Chat;
