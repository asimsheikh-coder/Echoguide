"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Volume2, Zap, Shield, Heart, Clock, MessageSquare, Headphones } from "lucide-react"

declare global {
  interface Window {
    vapiSDK: any
  }
}

export default function EchoGuidePage() {
  const [isActive, setIsActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [lastTranscript, setLastTranscript] = useState("")
  const [isReadingText, setIsReadingText] = useState(false)
  const vapiRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speakText = (text: string) => {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => setIsReadingText(true)
    utterance.onend = () => setIsReadingText(false)
    utterance.onerror = () => setIsReadingText(false)

    speechSynthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (scriptLoadedRef.current) return

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js"
    script.async = true
    script.type = "text/javascript"

    script.onload = () => {
      if (window.vapiSDK) {
        try {
          const vapiInstance = window.vapiSDK.run({
            apiKey: "YOUR_API_KEY",
            assistant: "94c4c126-1eb4-4fac-8f02-55f5a9b6a9a1",
            config: {
              position: "bottom-right",
              offset: "40px",
              width: "50px",
              height: "50px",
              idle: {
                color: `rgb(59, 130, 246)`,
                type: "pill",
                title: "Have a question?",
                subtitle: "Talk with our AI assistant",
                icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
              },
              loading: {
                color: `rgb(59, 130, 246)`,
                type: "pill",
                title: "Connecting...",
                subtitle: "Please wait",
                icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
              },
              active: {
                color: `rgb(239, 68, 68)`,
                type: "pill",
                title: "Call is in progress...",
                subtitle: "End the call.",
                icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
              },
            },
          })

          vapiRef.current = vapiInstance

          vapiInstance.on("call-start", () => {
            setIsActive(true)
          })

          vapiInstance.on("call-end", () => {
            setIsActive(false)
            setIsSpeaking(false)
            setIsAISpeaking(false)
            setLastTranscript("")
          })

          vapiInstance.on("speech-start", () => {
            setIsSpeaking(true)
          })

          vapiInstance.on("speech-end", () => {
            setIsSpeaking(false)
          })

          vapiInstance.on("message", (message: any) => {
            if (message.type === "speech-update") {
              if (message.role === "assistant") {
                setIsAISpeaking(message.status === "started")
              }
            }

            if (message.type === "transcript" && message.transcriptType === "final") {
              if (message.role === "user") {
                setLastTranscript(`You: ${message.transcript}`)
              } else if (message.role === "assistant") {
                setLastTranscript(`AI: ${message.transcript}`)
              }
            }
          })

          vapiInstance.on("error", (error: any) => {
            console.error("[v0] Vapi error:", error)
          })
        } catch (error) {
          console.error("[v0] Failed to initialize Vapi:", error)
        }
      }
    }

    script.onerror = () => {
      console.error("[v0] Failed to load Vapi SDK script")
    }

    document.body.appendChild(script)
    scriptLoadedRef.current = true

    return () => {
      window.speechSynthesis.cancel()
      if (vapiRef.current) {
        try {
          vapiRef.current.stop()
        } catch (error) {
          console.error("[v0] Error stopping Vapi:", error)
        }
      }
    }
  }, [])

  const activateVapi = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())

      const vapi = vapiRef.current
      if (!vapi) {
        console.error("[v0] Vapi instance not found")
        return
      }

      await vapi.start("94c4c126-1eb4-4fac-8f02-55f5a9b6a9a1")
    } catch (error) {
      console.error("[v0] Error:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert("Microphone permission is required to use EchoGuide. Please allow microphone access and try again.")
      }
    }
  }

  const handleStop = () => {
    if (vapiRef.current && isActive) {
      vapiRef.current.stop()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-primary/5 rounded-full border-2 border-primary/10">
              <Headphones className="w-6 h-6 text-primary" aria-hidden="true" />
              <span className="text-2xl font-bold text-foreground">EchoGuide</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className="text-6xl md:text-8xl font-bold mb-8 text-balance leading-[1.1] cursor-pointer hover:text-primary/90 transition-colors"
            onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
            title="Hover to hear this text"
          >
            Your Voice-Powered
            <br />
            <span className="text-primary">AI Companion</span>
          </h1>

          <p
            className="text-2xl md:text-3xl text-muted-foreground mb-16 max-w-4xl text-balance leading-relaxed cursor-pointer hover:text-foreground/90 transition-colors"
            onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
            title="Hover to hear this text"
          >
            Empowering visually impaired individuals with instant AI assistance through natural voice conversations.
          </p>

          {/* Voice Activation Button */}
          <div className="mb-20 relative">
            <button
              onClick={isActive ? handleStop : activateVapi}
              onMouseEnter={() => speakText(isActive ? "Click to stop talking to agent" : "Click to talk to agent")}
              className="relative group cursor-pointer"
              aria-label={isActive ? "Stop voice assistant" : "Activate voice assistant"}
              title="Hover to hear instructions"
            >
              {/* Pulse rings when active */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary/30 pulse-ring" />
                  <div
                    className="absolute inset-0 rounded-full bg-primary/20 pulse-ring"
                    style={{ animationDelay: "0.5s" }}
                  />
                </>
              )}

              {/* Main button */}
              <div
                className={`relative w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                  isActive
                    ? "bg-primary scale-110 shadow-primary/50"
                    : "bg-primary/95 hover:bg-primary hover:scale-105 shadow-primary/30"
                }`}
              >
                <Mic className="w-20 h-20 md:w-24 md:h-24 text-primary-foreground" aria-hidden="true" />
              </div>

              {/* Speaking animation */}
              {isSpeaking && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 items-end h-10">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-primary rounded-full wave-bar"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: "100%",
                      }}
                    />
                  ))}
                </div>
              )}
            </button>

            <div className="mt-20 space-y-4">
              {isReadingText && (
                <p className="text-base text-primary font-semibold flex items-center justify-center gap-2">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  Reading text aloud...
                </p>
              )}

              {isActive && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-4 text-base">
                    {isSpeaking && (
                      <span className="flex items-center gap-2 text-primary font-semibold px-4 py-2 bg-primary/10 rounded-full">
                        <Mic className="w-5 h-5 animate-pulse" />
                        You are speaking
                      </span>
                    )}
                    {isAISpeaking && (
                      <span className="flex items-center gap-2 text-accent font-semibold px-4 py-2 bg-accent/10 rounded-full">
                        <Volume2 className="w-5 h-5 animate-pulse" />
                        AI is speaking
                      </span>
                    )}
                  </div>

                  {lastTranscript && (
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto text-center px-6 py-3 bg-muted/50 rounded-lg">
                      {lastTranscript}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-24">
            <Button
              size="lg"
              className="text-xl px-10 py-7 cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
              onClick={isActive ? handleStop : activateVapi}
              onMouseEnter={() =>
                speakText(
                  isActive
                    ? "Click to stop the voice assistant"
                    : "Click to get started and activate the voice assistant",
                )
              }
              title="Hover to hear button description"
            >
              {isActive ? "Stop Assistant" : "Start Conversation"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-xl px-10 py-7 cursor-pointer border-2 bg-transparent"
              onMouseEnter={() => speakText("Click to learn more about EchoGuide features and benefits")}
              title="Hover to hear button description"
            >
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl">
            <Card className="p-10 text-center hover:shadow-xl transition-all hover:scale-105 border-2">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <h3
                className="text-2xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Natural Conversation
              </h3>
              <p
                className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Speak naturally and receive clear, helpful responses. EchoGuide understands context and provides
                relevant assistance.
              </p>
            </Card>

            <Card className="p-10 text-center hover:shadow-xl transition-all hover:scale-105 border-2">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-10 h-10 text-accent" aria-hidden="true" />
              </div>
              <h3
                className="text-2xl font-bold mb-4 cursor-pointer hover:text-accent transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Always Available
              </h3>
              <p
                className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                24/7 support whenever you need it. Your personal AI assistant is always ready to help with any task or
                question.
              </p>
            </Card>

            <Card className="p-10 text-center hover:shadow-xl transition-all hover:scale-105 border-2">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <h3
                className="text-2xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Instant Response
              </h3>
              <p
                className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Get immediate answers and assistance. No waiting, no delays. Lightning-fast AI responses when you need
                them most.
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2
              className="text-5xl md:text-6xl font-bold mb-8 cursor-pointer hover:text-primary transition-colors"
              onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
              title="Hover to hear this text"
            >
              Simple. Powerful. Accessible.
            </h2>
            <p
              className="text-2xl text-muted-foreground mb-16 text-balance cursor-pointer hover:text-foreground/80 transition-colors"
              onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
              title="Hover to hear this text"
            >
              Three easy steps to start your journey with EchoGuide
            </p>

            <div className="grid md:grid-cols-3 gap-12 text-left">
              <div className="relative">
                <div className="text-7xl font-bold text-primary/15 mb-6">01</div>
                <h3
                  className="text-3xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Click to Connect
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Simply click the microphone button to activate EchoGuide. The system is designed for maximum
                  accessibility and ease of use.
                </p>
              </div>

              <div className="relative">
                <div className="text-7xl font-bold text-primary/15 mb-6">02</div>
                <h3
                  className="text-3xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Speak Naturally
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Ask questions, request assistance, or have a conversation. EchoGuide understands natural language and
                  responds intelligently.
                </p>
              </div>

              <div className="relative">
                <div className="text-7xl font-bold text-primary/15 mb-6">03</div>
                <h3
                  className="text-3xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Get Instant Help
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Receive clear, spoken responses that help you navigate tasks, access information, and live
                  independently with confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="text-5xl md:text-6xl font-bold mb-8 cursor-pointer hover:text-primary transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Built for Everyone
              </h2>
              <p
                className="text-2xl text-muted-foreground text-balance cursor-pointer hover:text-foreground/80 transition-colors"
                onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                title="Hover to hear this text"
              >
                Every feature is designed with accessibility and independence in mind
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-2">
                <Heart className="w-12 h-12 text-primary mb-6" aria-hidden="true" />
                <h3
                  className="text-2xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Empowering Independence
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Navigate daily tasks with confidence. From reading text to getting directions, EchoGuide is your
                  reliable companion for independent living.
                </p>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-2">
                <Volume2 className="w-12 h-12 text-accent mb-6" aria-hidden="true" />
                <h3
                  className="text-2xl font-bold mb-4 cursor-pointer hover:text-accent transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Crystal Clear Audio
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  High-quality voice responses optimized for clarity and understanding. Adjustable speed and volume to
                  match your preferences.
                </p>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-2">
                <Shield className="w-12 h-12 text-primary mb-6" aria-hidden="true" />
                <h3
                  className="text-2xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Privacy First
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Your conversations are secure and private. We prioritize your data protection and never share your
                  information without consent.
                </p>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-2">
                <Zap className="w-12 h-12 text-accent mb-6" aria-hidden="true" />
                <h3
                  className="text-2xl font-bold mb-4 cursor-pointer hover:text-accent transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Lightning Fast
                </h3>
                <p
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
                  onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
                  title="Hover to hear this text"
                >
                  Instant activation and rapid responses. No waiting, no delays. Get the help you need exactly when you
                  need it most.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-5xl md:text-6xl font-bold mb-8 text-balance cursor-pointer hover:opacity-90 transition-opacity"
              onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
              title="Hover to hear this text"
            >
              Ready to Experience True Independence?
            </h2>
            <p
              className="text-2xl mb-12 opacity-95 text-balance leading-relaxed cursor-pointer hover:opacity-100 transition-opacity"
              onMouseEnter={(e) => speakText(e.currentTarget.textContent || "")}
              title="Hover to hear this text"
            >
              Join thousands of users who have discovered freedom and confidence with EchoGuide. Start your journey
              today.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-xl px-12 py-7 cursor-pointer shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              onClick={isActive ? handleStop : activateVapi}
              onMouseEnter={() =>
                speakText(
                  isActive
                    ? "Click to stop EchoGuide"
                    : "Click to activate EchoGuide now and start talking to your AI assistant",
                )
              }
              title="Hover to hear button description"
            >
              {isActive ? "Stop Assistant" : "Start Your Journey"}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <Headphones className="w-8 h-8 text-primary" aria-hidden="true" />
              <span className="text-2xl font-bold">EchoGuide</span>
            </div>
            <p className="text-lg text-muted-foreground text-center">
              © 2025 EchoGuide. Empowering independence through AI.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-lg text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-lg text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-lg text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
