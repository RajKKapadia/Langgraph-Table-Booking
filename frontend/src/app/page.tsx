"use client"

import React, { KeyboardEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Send, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Markdown from "react-markdown"

type ToolExecution = {
  name: string
  args: any
  content: string
}

type Message = {
  id: number
  text: string
  sender: "user" | "assistant"
  tools?: ToolExecution[]
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "assistant" }
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState("")
  const [currentTools, setCurrentTools] = useState<ToolExecution[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({})
  const [currentToolsOpen, setCurrentToolsOpen] = useState<boolean>(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentTools, openStates, currentToolsOpen])


  const toggleMessageTools = (messageId: number) => {
    setOpenStates(current => ({
      ...current,
      [messageId]: !(current[messageId] ?? true)
    }))
  }

  const callChatAPI = async (userMessage: string) => {
    setIsLoading(true)
    setCurrentTools([])
    setTypingMessage("")

    try {

      // Format the chat history in the required format for the API
      const chatHistory = messages.map((msg, index) => {
        if (index === 0) return null // Skip the initial greeting

        if (index % 2 === 0) { // Even indices (after skipping first) are assistant responses
          return {
            query: messages[index - 1].text,
            response: msg.text
          }
        }
        return null
      }).filter(Boolean)


      const requestBody = {
        query: userMessage,
        chat_history: chatHistory,
        user_id: "abcd-efgh-ijkl-mnop"
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v0/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_BACKEND_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.")
      }

      // Read the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let finalAnswer = ""
      let tempToolName = ""
      let tempToolArgs = null
      let tempToolContent = ""
      let toolsCollected: ToolExecution[] = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Split by newlines to get individual JSON objects
        const lines = buffer.split("\n")

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (!line) continue // Skip empty lines

          try {
            const chunk = JSON.parse(line)

            // Process different chunk types
            if (chunk.type === "tool_name") {
              tempToolName = chunk.content
              tempToolArgs = null
              tempToolContent = ""
            }
            else if (chunk.type === "tool_args") {
              // Parse the content directly - it should be the actual arguments
              tempToolArgs = chunk.content

              // Show the tool in progress
              if (tempToolName) {
                const inProgressTool: ToolExecution = {
                  name: tempToolName,
                  args: tempToolArgs,
                  content: "Processing..."
                }

                // Find if we already have this tool in progress
                const existingToolIndex = toolsCollected.findIndex(
                  tool => tool.name === tempToolName && tool.content === "Processing..."
                )

                if (existingToolIndex >= 0) {
                  const updatedTools = [...toolsCollected]
                  updatedTools[existingToolIndex] = inProgressTool
                  toolsCollected = updatedTools
                } else {
                  toolsCollected = [...toolsCollected, inProgressTool]
                }

                // Update the UI
                setCurrentTools([...toolsCollected])
              }
            }
            else if (chunk.type === "tool_content") {
              tempToolContent = chunk.content

              if (tempToolName) {
                const completedTool: ToolExecution = {
                  name: tempToolName,
                  args: tempToolArgs,
                  content: tempToolContent
                }

                const existingToolIndex = toolsCollected.findIndex(
                  tool => tool.name === tempToolName && tool.content === "Processing..."
                )

                if (existingToolIndex >= 0) {
                  const updatedTools = [...toolsCollected]
                  updatedTools[existingToolIndex] = completedTool
                  toolsCollected = updatedTools
                } else {
                  toolsCollected = [...toolsCollected, completedTool]
                }

                setCurrentTools([...toolsCollected])
                tempToolName = ""
                tempToolArgs = null
                tempToolContent = ""
              }
            }
            else if (chunk.type === "answer") {
              finalAnswer = chunk.content
              setTypingMessage(finalAnswer)
            }
          } catch (e) {
            console.error("Error processing chunk:", e, "Line:", line)
          }
        }

        // Keep the last partial line in the buffer
        buffer = lines[lines.length - 1]
      }

      // Add the final answer with tools to the messages
      if (finalAnswer) {

        const newMessageId = messages.length + 2

        setMessages(current => [...current, {
          id: newMessageId,
          text: finalAnswer,
          sender: "assistant",
          tools: toolsCollected.length > 0 ? toolsCollected : undefined
        }])

        if (toolsCollected.length > 0) {
          setOpenStates(current => ({
            ...current,
            [newMessageId]: true
          }))
        }

      } else {
        // Fallback message

        const newMessageId = messages.length + 2

        setMessages(current => [...current, {
          id: newMessageId,
          text: `I have processed your request, but could not generate a proper response.`,
          sender: "assistant",
          tools: toolsCollected.length > 0 ? toolsCollected : undefined
        }])

        if (toolsCollected.length > 0) {
          setOpenStates(current => ({
            ...current,
            [newMessageId]: true
          }))
        }

      }
    } catch (error) {
      console.error("Error calling chat API:", error)
      // Show error message
      setMessages(current => [...current, {
        id: current.length + 1,
        text: "Sorry, there was an error processing your request. Please try again later.",
        sender: "assistant"
      }])
    } finally {
      setIsLoading(false)
      setTypingMessage("")
      setCurrentTools([])
    }
  }

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isLoading) {
      // Add user message to chat
      setMessages(current => [...current, {
        id: messages.length + 1,
        text: newMessage,
        sender: "user"
      }])

      const userMessage = newMessage
      setNewMessage("")

      // Call API with user message
      await callChatAPI(userMessage)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Function to format tool args as a pretty JSON string
  const formatToolArgs = (args: any) => {
    if (args === null || args === undefined) {
      return "{}";
    }
    if (typeof args === "object") {
      return JSON.stringify(args, null, 2);
    }
    if (typeof args === "string" && args.trim().startsWith("{")) {
      try {
        return JSON.stringify(JSON.parse(args), null, 2);
      } catch (e) {
        // If parsing fails, return the original string
        return args;
      }
    }
    return String(args);
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 bg-gray-50">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2 max-w-xs">
              {message.sender === "assistant" && (
                <Avatar className="h-8 w-8 bg-primary text-white flex items-center justify-center">
                  <span className="text-xs">AI</span>
                </Avatar>
              )}

              <div className="flex flex-col">

                {message.tools && message.tools.length > 0 && (
                  <Collapsible className="mb-1 w-full" open={openStates[message.id]} onOpenChange={() => toggleMessageTools(message.id)}>
                    <CollapsibleTrigger asChild className="flex items-center text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                      <div className="flex items-center gap-1">
                        {(openStates[message.id] ?? true) ? (
                          <><ChevronUp className="h-3 w-3" /><span>Hide execution details ({message.tools.length})</span></>
                        ) : (
                          <><ChevronDown className="h-3 w-3" /><span>Show execution details ({message.tools.length})</span></>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-gray-100 p-2 rounded-md mb-1 text-xs font-mono overflow-x-auto">
                        {message.tools.map((tool, index) => (
                          <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                            <div className="font-bold">Tool: {tool.name}</div>
                            <div className="mt-1">
                              <div className="font-bold">Arguments:</div>
                              <pre className="bg-gray-200 p-1 rounded mt-1 overflow-x-auto">
                                {formatToolArgs(tool.args)}
                              </pre>
                            </div>
                            <div className="mt-1">
                              <div className="font-bold">Result:</div>
                              <div className="bg-gray-200 p-1 rounded mt-1">{tool.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Card className={`p-1 ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-white"}`}>
                  <CardContent className="p-1">
                    <div className="text-sm text-justify">
                      <Markdown>
                        {message.text}
                      </Markdown>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {message.sender === "user" && (
                <Avatar className="h-8 w-8 bg-gray-600 text-white flex items-center justify-center">
                  <span className="text-xs">U</span>
                </Avatar>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator with live tool execution display */}
        {(typingMessage || currentTools.length > 0) && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-xs">
              <Avatar className="h-8 w-8 bg-primary text-white flex items-center justify-center mt-1">
                <span className="text-xs">AI</span>
              </Avatar>

              <div className="flex flex-col">


                {currentTools.length > 0 && (
                  <Collapsible className="mb-1 w-full" open={currentToolsOpen} onOpenChange={setCurrentToolsOpen}>
                    <CollapsibleTrigger asChild className="flex items-center text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                      <div className="flex items-center gap-1">
                        {currentToolsOpen ? (
                          <><ChevronUp className="h-3 w-3" /><span>Hide execution details ({currentTools.length})</span></>
                        ) : (
                          <><ChevronDown className="h-3 w-3" /><span>Show execution details ({currentTools.length})</span></>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-gray-100 p-2 rounded-md mb-1 text-xs font-mono overflow-x-auto">
                        {currentTools.map((tool, index) => (
                          <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                            <div className="font-bold">Tool: {tool.name}</div>
                            <div className="mt-1">
                              <div className="font-bold">Arguments:</div>
                              <pre className="bg-gray-200 p-1 rounded mt-1 overflow-x-auto">
                                {formatToolArgs(tool.args)}
                              </pre>
                            </div>
                            <div className="mt-1">
                              <div className="font-bold">Result:</div>
                              <div className="bg-gray-200 p-1 rounded mt-1">
                                {tool.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {typingMessage && (
                  <Card className="p-1 bg-white">
                    <CardContent className="p-1">
                      <div className="text-sm text-justify">
                        <Markdown>
                          {typingMessage}
                        </Markdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          disabled={isLoading || !newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
