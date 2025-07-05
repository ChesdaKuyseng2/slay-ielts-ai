
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, MicOff, Play, Pause, Square, Clock, User } from 'lucide-react';
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
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [currentPart, setCurrentPart] = useState('part1');
  const [preparationTime, setPreparationTime] = useState(0);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [isPreparation, setIsPreparation] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPreparation && preparationTime > 0) {
      timer = setInterval(() => {
        setPreparationTime(prev => {
          if (prev <= 1) {
            setIsPreparation(false);
            toast({
              title: "Preparation Time Over",
              description: "You can now start recording your response.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isRecording) {
      timer = setInterval(() => {
        setSpeakingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPreparation, preparationTime, isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordings(prev => ({ ...prev, [currentPart]: audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSpeakingTime(0);
      
      toast({
        title: "Recording Started",
        description: `Recording your response for ${currentPart}...`,
      });
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
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
        title: "Recording Stopped",
        description: "Your response has been saved.",
      });
    }
  };

  const startPreparation = (seconds: number) => {
    setPreparationTime(seconds);
    setIsPreparation(true);
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
    onComplete(recordings);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Bar */}
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-red-600" />
                <span className="font-medium">IELTS Speaking Test</span>
              </div>
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <Mic className="h-3 w-3 mr-1" />
                  Recording - {formatTime(speakingTime)}
                </Badge>
              )}
              {isPreparation && (
                <Badge variant="outline" className="border-orange-500 text-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Preparation - {formatTime(preparationTime)}
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Parts completed: {Object.keys(recordings).length} / 3
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentPart} onValueChange={setCurrentPart}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="part1" className="flex items-center space-x-2">
            <span>Part 1: Introduction</span>
            {recordings.part1 && <Badge variant="secondary" className="ml-2">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="part2" className="flex items-center space-x-2">
            <span>Part 2: Cue Card</span>
            {recordings.part2 && <Badge variant="secondary" className="ml-2">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="part3" className="flex items-center space-x-2">
            <span>Part 3: Discussion</span>
            {recordings.part3 && <Badge variant="secondary" className="ml-2">✓</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="part1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Part 1: Introduction and Interview</CardTitle>
              <p className="text-sm text-gray-600">
                Duration: 4-5 minutes. The examiner will ask you general questions about yourself.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium mb-2">Sample Questions:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Can you tell me your full name?</li>
                  <li>Where are you from?</li>
                  <li>Do you work or study?</li>
                  <li>What do you like to do in your free time?</li>
                  <li>Tell me about your hometown.</li>
                </ul>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="part2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Part 2: Individual Long Turn</CardTitle>
              <p className="text-sm text-gray-600">
                Duration: 3-4 minutes. You will have 1 minute to prepare, then speak for 1-2 minutes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="font-medium mb-2">Cue Card:</p>
                <div className="text-sm">
                  <p className="font-semibold mb-2">
                    {testData.part2?.topic || "Describe a memorable journey you have taken."}
                  </p>
                  <p className="mb-2">You should say:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>where you went</li>
                    <li>when you went there</li>
                    <li>who you went with</li>
                    <li>and explain why this journey was memorable for you</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isPreparation && !isRecording ? (
                  <Button 
                    onClick={() => startPreparation(60)}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Start Preparation (1 min)
                  </Button>
                ) : isPreparation ? (
                  <Button disabled size="lg">
                    <Clock className="h-5 w-5 mr-2" />
                    Preparing... {formatTime(preparationTime)}
                  </Button>
                ) : !isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="part3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Part 3: Two-way Discussion</CardTitle>
              <p className="text-sm text-gray-600">
                Duration: 4-5 minutes. Discussion of more abstract ideas related to Part 2 topic.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-medium mb-2">Discussion Questions:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>How has travel changed in your country over the past few decades?</li>
                  <li>What are the benefits of international travel?</li>
                  <li>Do you think tourism has a positive or negative impact on local communities?</li>
                  <li>How might travel and tourism change in the future?</li>
                </ul>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="outline"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
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
          className="bg-green-600 hover:bg-green-700"
          disabled={Object.keys(recordings).length < 3}
        >
          Submit Speaking Test
        </Button>
      </div>
    </div>
  );
};

export default SpeakingTest;
