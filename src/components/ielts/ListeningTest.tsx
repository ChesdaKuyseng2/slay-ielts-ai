
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, RotateCcw, HelpCircle, Clock } from 'lucide-react';
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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const togglePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Audio play error:', error);
        toast({
          title: "Audio Error",
          description: "Unable to play audio. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Auto-save progress
    saveProgress();
  };

  const saveProgress = async () => {
    try {
      await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...testData,
            answers,
            progress: 'in_progress',
            last_updated: new Date().toISOString()
          }
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Submitting listening test with answers:', answers);
      
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Enhanced fallback questions if not provided by AI
  const defaultQuestions = [
    {
      type: 'multiple_choice',
      question: 'What is the main topic of the conversation?',
      options: ['Academic enrollment', 'Career planning', 'Housing arrangements', 'Travel booking']
    },
    {
      type: 'fill_blank',
      question: 'The speaker mentions that the process requires ________ documentation.'
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

  const questions = testData?.questions && testData.questions.length > 0 ? testData.questions : defaultQuestions;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Audio Player Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              <span>IELTS Listening Test - Section {testData.section || 1}</span>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            You will hear the audio only once. Take notes while listening.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={testData.audioUrl || "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBj+g4PK8ZyAFl"}
            preload="metadata"
          />
          
          {/* Audio Controls */}
          <div className="flex items-center space-x-4">
            <Button 
              onClick={togglePlayPause} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isPlaying ? 'Pause' : 'Play Audio'}
            </Button>
            
            <Button onClick={resetAudio} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>

            {/* Progress Bar */}
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Transcript Toggle */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-48"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </Button>
          </div>

          {/* Transcript Display */}
          {showTranscript && (
            <Card className="bg-yellow-50 border-yellow-200">
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
      <Card>
        <CardHeader>
          <CardTitle>Questions 1-{questions.length}</CardTitle>
          <p className="text-sm text-gray-600">
            Answer the questions based on what you hear in the audio.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question: any, index: number) => (
            <div key={index} className="border-l-2 border-gray-200 pl-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium mb-3 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mr-2">
                      Q{index + 1}
                    </span>
                    {question.question}
                  </p>
                  
                  {question.type === 'multiple_choice' ? (
                    <div className="space-y-2">
                      {question.options?.map((option: string, optIndex: number) => (
                        <label key={optIndex} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name={`question_${index}`}
                            value={option}
                            checked={answers[`question_${index}`] === option}
                            onChange={(e) => handleAnswerChange(`question_${index}`, e.target.value)}
                            className="text-blue-600"
                          />
                          <span className="text-sm">
                            <strong>{String.fromCharCode(65 + optIndex)}.</strong> {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder="Type your answer here..."
                      value={answers[`question_${index}`] || ''}
                      onChange={(e) => handleAnswerChange(`question_${index}`, e.target.value)}
                      className="max-w-md"
                    />
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExplainAnswer(index)}
                  className="ml-4"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Submit Section */}
          <div className="flex justify-between items-center pt-6 border-t bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              <p><strong>Progress:</strong> {Object.keys(answers).length} / {questions.length} answered</p>
              <p className="text-xs mt-1">Review your answers before submitting</p>
            </div>
            <Button 
              onClick={handleSubmit} 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answers'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListeningTest;
