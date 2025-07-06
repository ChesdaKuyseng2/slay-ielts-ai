
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, MicOff, Square, Clock, User, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpeakingTestProps {
  testData: any;
  sessionId: string;
  onComplete: (recordings: any) => void;
}

const SpeakingTest: React.FC<SpeakingTestProps> = ({ 
  testData, 
  sessionId, 
  onComplete 
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Record<string, any>>({});
  const [currentPart, setCurrentPart] = useState('part1');
  const [preparationTime, setPreparationTime] = useState(0);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [isPreparation, setIsPreparation] = useState(false);
  const [canStartRecording, setCanStartRecording] = useState(true);
  const [recordingPermission, setRecordingPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const preparationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (preparationTimerRef.current) clearInterval(preparationTimerRef.current);
      if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingPermission(true);
      stream.getTracks().forEach(track => track.stop());
      toast({
        title: "Microphone Ready",
        description: "Your microphone is ready for the speaking test.",
      });
    } catch (error) {
      setRecordingPermission(false);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to take the speaking test.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isPreparation && preparationTime > 0) {
      preparationTimerRef.current = setInterval(() => {
        setPreparationTime(prev => {
          if (prev <= 1) {
            setIsPreparation(false);
            setCanStartRecording(true);
            toast({
              title: "Preparation Time Over",
              description: "You can now start recording your response.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
      }
    }

    return () => {
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
      }
    };
  }, [isPreparation, preparationTime]);

  useEffect(() => {
    if (isRecording) {
      speakingTimerRef.current = setInterval(() => {
        setSpeakingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current);
      }
    }

    return () => {
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!canStartRecording || !recordingPermission) {
      toast({
        title: "Cannot Start Recording",
        description: "Please ensure microphone permission is granted.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordings(prev => ({ 
          ...prev, 
          [currentPart]: {
            blob: audioBlob,
            url: audioUrl,
            duration: speakingTime,
            timestamp: new Date().toISOString()
          }
        }));
        
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setSpeakingTime(0);
      
      toast({
        title: "Recording Started",
        description: `Recording your response for ${currentPart}...`,
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setSpeakingTime(0);
      toast({
        title: "Recording Completed",
        description: "Your response has been saved successfully.",
      });
    }
  };

  const startPreparation = (seconds: number) => {
    setPreparationTime(seconds);
    setIsPreparation(true);
    setCanStartRecording(false);
    toast({
      title: "Preparation Time Started",
      description: `You have ${seconds} seconds to prepare your answer.`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (Object.keys(recordings).length < 3) {
      toast({
        title: "Incomplete Test",
        description: "Please complete all three parts before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert recordings to a format suitable for submission
    const submissionData = {
      recordings: Object.entries(recordings).map(([part, data]) => ({
        part,
        duration: data.duration,
        timestamp: data.timestamp,
        hasRecording: true
      })),
      totalDuration: Object.values(recordings).reduce((sum: number, r: any) => sum + (r.duration || 0), 0),
      completedAt: new Date().toISOString()
    };
    
    onComplete(submissionData);
  };

  const isPartCompleted = (part: string) => recordings[part] !== undefined;
  const allPartsCompleted = Object.keys(recordings).length >= 3;

  const playRecording = (part: string) => {
    const recording = recordings[part];
    if (recording && recording.url) {
      const audio = new Audio(recording.url);
      audio.play();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Bar */}
      <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-700" />
                <span className="font-medium text-blue-800">IELTS Speaking Test</span>
              </div>
              {!recordingPermission && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Microphone Access Required
                </Badge>
              )}
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <Mic className="h-3 w-3 mr-1" />
                  Recording - {formatTime(speakingTime)}
                </Badge>
              )}
              {isPreparation && (
                <Badge variant="outline" className="border-orange-500 text-orange-600 animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Preparation - {formatTime(preparationTime)}
                </Badge>
              )}
            </div>
            <div className="text-sm text-blue-700">
              Parts completed: {Object.keys(recordings).length} / 3
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentPart} onValueChange={setCurrentPart}>
        <TabsList className="grid w-full grid-cols-3 bg-blue-100">
          <TabsTrigger value="part1" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <span>Part 1: Introduction</span>
            {isPartCompleted('part1') && <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="part2" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <span>Part 2: Cue Card</span>
            {isPartCompleted('part2') && <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="part3" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <span>Part 3: Discussion</span>
            {isPartCompleted('part3') && <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800">✓</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Part 1 */}
        <TabsContent value="part1" className="space-y-4">
          <Card className="border border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <CardTitle className="text-blue-800">Part 1: Introduction and Interview</CardTitle>
              <p className="text-sm text-blue-600">
                Duration: 4-5 minutes. Answer general questions about yourself and familiar topics.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium mb-2 text-blue-800">Sample Questions:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-blue-700">
                  <li>Can you tell me your full name?</li>
                  <li>Where are you from?</li>
                  <li>Do you work or study?</li>
                  <li>What do you like to do in your free time?</li>
                  <li>Tell me about your hometown.</li>
                </ul>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isRecording && !isPartCompleted('part1') ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                    disabled={!recordingPermission}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : isRecording ? (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="text-green-700 p-3 bg-green-100">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Part 1 Completed
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => playRecording('part1')}
                      className="border-blue-300 text-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Recording
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Part 2 */}
        <TabsContent value="part2" className="space-y-4">
          <Card className="border border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <CardTitle className="text-blue-800">Part 2: Individual Long Turn</CardTitle>
              <p className="text-sm text-blue-600">
                Duration: 3-4 minutes. You have 1 minute to prepare, then speak for 1-2 minutes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="font-medium mb-2 text-yellow-800">Cue Card:</p>
                <div className="text-sm">
                  <p className="font-semibold mb-2 text-yellow-900">
                    {testData.part2?.topic || "Describe a memorable journey you have taken."}
                  </p>
                  <p className="mb-2 text-yellow-800">You should say:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-yellow-700">
                    <li>where you went</li>
                    <li>when you went there</li>
                    <li>who you went with</li>
                    <li>and explain why this journey was memorable for you</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isPreparation && !isRecording && !isPartCompleted('part2') ? (
                  <Button 
                    onClick={() => startPreparation(60)}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Start Preparation (1 min)
                  </Button>
                ) : isPreparation ? (
                  <Button disabled size="lg" className="bg-orange-300">
                    <Clock className="h-5 w-5 mr-2" />
                    Preparing... {formatTime(preparationTime)}
                  </Button>
                ) : !isRecording && canStartRecording && !isPartCompleted('part2') ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                    disabled={!recordingPermission}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : isRecording ? (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                ) : isPartCompleted('part2') ? (
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="text-green-700 p-3 bg-green-100">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Part 2 Completed
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => playRecording('part2')}
                      className="border-blue-300 text-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Recording
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Part 3 */}
        <TabsContent value="part3" className="space-y-4">
          <Card className="border border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <CardTitle className="text-blue-800">Part 3: Two-way Discussion</CardTitle>
              <p className="text-sm text-blue-600">
                Duration: 4-5 minutes. Discussion of abstract ideas related to Part 2 topic.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="font-medium mb-2 text-green-800">Discussion Questions:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-green-700">
                  <li>How has travel changed in your country over the past few decades?</li>
                  <li>What are the benefits of international travel?</li>
                  <li>Do you think tourism has a positive or negative impact on local communities?</li>
                  <li>How might travel and tourism change in the future?</li>
                </ul>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isRecording && !isPartCompleted('part3') ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                    disabled={!recordingPermission}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : isRecording ? (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="text-green-700 p-3 bg-green-100">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Part 3 Completed
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => playRecording('part3')}
                      className="border-blue-300 text-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Recording
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleSubmit} 
          size="lg" 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 shadow-lg"
          disabled={!allPartsCompleted}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Submit Speaking Test
        </Button>
      </div>
    </div>
  );
};

export default SpeakingTest;
