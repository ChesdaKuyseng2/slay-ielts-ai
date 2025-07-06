import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, RotateCcw, HelpCircle, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ListeningTestProps {
  testData: any;
  sessionId: string;
  onComplete: (answers: any) => void;
  onExplainAnswer: (questionIndex: number) => void;
}

const ListeningTest: React.FC<ListeningTestProps> = ({ 
  testData, 
  sessionId, 
  onComplete, 
  onExplainAnswer 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAudioLoaded, setHasAudioLoaded] = useState(false);

  // Generate audio using text-to-speech
  const generateAudio = async () => {
    try {
      const text = testData.transcript || "Welcome to this IELTS Listening practice session. In this section, you will hear a conversation about the topic we are discussing today. Please listen carefully and answer the questions that follow.";
      
      // Use Web Speech API for text-to-speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Create audio blob from speech
      speechSynthesis.speak(utterance);
      setHasAudioLoaded(true);
      
      toast({
        title: "Audio Ready",
        description: "Click play to start the listening test.",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      setHasAudioLoaded(true); // Still allow the test to proceed
    }
  };

  useEffect(() => {
    generateAudio();
  }, [testData]);

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        } else {
          const text = testData.transcript || "Welcome to this IELTS Listening practice session.";
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.8;
          utterance.onend = () => setIsPlaying(false);
          speechSynthesis.speak(utterance);
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio play error:', error);
      toast({
        title: "Audio Error",
        description: "Unable to play audio. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetAudio = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const validAnswers = {
        ...answers,
        sessionId,
        completedAt: new Date().toISOString(),
        skillType: 'listening'
      };
      
      await onComplete(validAnswers);
    } catch (error) {
      console.error('Error submitting listening test:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your test. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Enhanced questions with correct answers
  const questions = testData?.questions || [
    {
      type: 'multiple_choice',
      question: 'What is the main topic of the conversation?',
      options: ['Academic enrollment', 'Career planning', 'Housing arrangements', 'Travel booking'],
      correctAnswer: 'Academic enrollment'
    },
    {
      type: 'fill_blank',
      question: 'The speaker mentions that the process requires ________ documentation.',
      correctAnswer: 'proper'
    },
    {
      type: 'multiple_choice',
      question: 'According to the conversation, what is the recommended timeframe?',
      options: ['1-2 weeks', '2-3 weeks', '3-4 weeks', '4-5 weeks']
    },
    {
      type: 'fill_blank',
      question: 'The cost mentioned is approximately ________ dollars.'
    },
    {
      type: 'multiple_choice',
      question: 'What additional service is offered?',
      options: ['Insurance coverage', 'Payment plans', 'Technical support', 'Customer consultation']
    },
    {
      type: 'fill_blank',
      question: 'The next available appointment is on ________.'
    },
    {
      type: 'multiple_choice',
      question: 'What document is required for verification?',
      options: ['Passport', 'Driver license', 'Bank statement', 'Employment letter']
    },
    {
      type: 'fill_blank',
      question: 'The processing time is usually ________ business days.'
    },
    {
      type: 'matching',
      question: 'Match the following requirements with their categories:',
      options: ['Personal information', 'Financial documents', 'Academic records', 'Reference letters']
    },
    {
      type: 'fill_blank',
      question: 'For more information, contact the office at ________.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Audio Player Section */}
      <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-blue-700" />
              <span className="text-blue-800">IELTS Listening Test - Section {testData.section || 1}</span>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1 border-blue-300 text-blue-700">
              <Clock className="h-3 w-3" />
              <span>Ready to Play</span>
            </Badge>
          </CardTitle>
          <p className="text-sm text-blue-600">
            You will hear the audio. Take notes while listening and answer the questions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Controls */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-blue-200">
            <Button 
              onClick={togglePlayPause} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              disabled={!hasAudioLoaded}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isPlaying ? 'Pause Audio' : 'Play Audio'}
            </Button>
            
            <Button onClick={resetAudio} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>

            <div className="flex-1 bg-blue-100 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full w-0 transition-all duration-300" />
            </div>
          </div>

          {/* Transcript Toggle */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-48 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </Button>
          </div>

          {/* Transcript Display */}
          {showTranscript && (
            <Card className="bg-yellow-50 border-yellow-300">
              <CardContent className="p-4">
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {testData.transcript || "Transcript: Welcome to this IELTS Listening practice session. In this section, you will hear a conversation about the topic we are discussing today. Please listen carefully and answer the questions that follow. Pay attention to specific details, names, numbers, and key information that will help you complete the tasks successfully."}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card className="border border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardTitle className="text-blue-800">Questions 1-{questions.length}</CardTitle>
          <p className="text-sm text-blue-600">
            Answer the questions based on what you hear in the audio.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {questions.map((question: any, index: number) => (
            <div key={index} className="border-l-4 border-blue-300 pl-6 py-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium mb-3 text-sm">
                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs mr-3 font-bold">
                      Q{index + 1}
                    </span>
                    {question.question}
                  </p>
                  
                  {question.type === 'multiple_choice' ? (
                    <div className="space-y-2">
                      {question.options?.map((option: string, optIndex: number) => (
                        <label key={optIndex} className="flex items-center space-x-3 cursor-pointer hover:bg-blue-100 p-3 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name={`question_${index}`}
                            value={option}
                            checked={answers[`question_${index}`] === option}
                            onChange={(e) => handleAnswerChange(`question_${index}`, e.target.value)}
                            className="text-blue-600 w-4 h-4"
                          />
                          <span className="text-sm">
                            <strong className="text-blue-700">{String.fromCharCode(65 + optIndex)}.</strong> {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder="Type your answer here..."
                      value={answers[`question_${index}`] || ''}
                      onChange={(e) => handleAnswerChange(`question_${index}`, e.target.value)}
                      className="max-w-md border-blue-300 focus:border-blue-500"
                    />
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExplainAnswer(index)}
                  className="ml-4 text-blue-600 hover:bg-blue-100"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Submit Section */}
          <div className="flex justify-between items-center pt-6 border-t bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <div className="text-sm text-blue-700">
              <p><strong>Progress:</strong> {Object.keys(answers).length} / {questions.length} answered</p>
              <p className="text-xs mt-1">Review your answers before submitting</p>
            </div>
            <Button 
              onClick={handleSubmit} 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Answers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListeningTest;
