import React, { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle, RefreshCw } from 'lucide-react';

const QuizQuestion = ({
  question,
  type = 'multiple-choice', // 'multiple-choice', 'true-false', 'fill-blank', 'code-output'
  options = [],
  correctAnswer,
  explanation,
  codeSnippet,
  difficulty = 'beginner'
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [userInput, setUserInput] = useState('');

  const handleSubmit = () => {
    setShowResult(true);
  };

  const resetQuestion = () => {
    setSelectedAnswer(null);
    setUserInput('');
    setShowResult(false);
  };

  const isCorrect = () => {
    if (type === 'fill-blank' || type === 'code-output') {
      return userInput.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
    return selectedAnswer === correctAnswer;
  };

  const difficultyColors = {
    beginner: 'text-green-600',
    intermediate: 'text-yellow-600',
    advanced: 'text-red-600'
  };

  const renderQuestionContent = () => {
    switch (type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  showResult && selectedAnswer === index
                    ? isCorrect()
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : ''
                } ${
                  showResult && index === correctAnswer && selectedAnswer !== correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => setSelectedAnswer(index)}
                  disabled={showResult}
                  className="sr-only"
                />
                <div className="flex items-center w-full">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswer === index ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedAnswer === index && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <span className="text-gray-700">{option}</span>
                  {showResult && selectedAnswer === index && (
                    <div className="ml-auto">
                      {isCorrect() ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                    </div>
                  )}
                  {showResult && index === correctAnswer && selectedAnswer !== correctAnswer && (
                    <CheckCircle className="text-green-600 ml-auto" size={20} />
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="flex space-x-4">
            {['True', 'False'].map((option, index) => (
              <label
                key={index}
                className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors flex-1 ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  showResult && selectedAnswer === index
                    ? isCorrect()
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => setSelectedAnswer(index)}
                  disabled={showResult}
                  className="sr-only"
                />
                <span className="font-medium text-gray-700">{option}</span>
                {showResult && selectedAnswer === index && (
                  <div className="ml-2">
                    {isCorrect() ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-red-600" size={20} />
                    )}
                  </div>
                )}
              </label>
            ))}
          </div>
        );

      case 'fill-blank':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={showResult}
              placeholder="Enter your answer..."
              className={`w-full p-3 border-2 rounded-lg ${
                showResult
                  ? isCorrect()
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500'
              } outline-none transition-colors`}
            />
            {showResult && (
              <div className="flex items-center space-x-2">
                {isCorrect() ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <span className={isCorrect() ? 'text-green-600' : 'text-red-600'}>
                  {isCorrect() ? 'Correct!' : `Correct answer: ${correctAnswer}`}
                </span>
              </div>
            )}
          </div>
        );

      case 'code-output':
        return (
          <div className="space-y-4">
            {codeSnippet && (
              <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                <code>{codeSnippet}</code>
              </pre>
            )}
            <p className="text-gray-600">What will this code output?</p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={showResult}
              placeholder="Enter the expected output..."
              className={`w-full p-3 border-2 rounded-lg ${
                showResult
                  ? isCorrect()
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500'
              } outline-none transition-colors`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const canSubmit = () => {
    if (type === 'fill-blank' || type === 'code-output') {
      return userInput.trim() !== '';
    }
    return selectedAnswer !== null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <HelpCircle className="text-blue-600" size={20} />
          <span className="text-sm font-medium text-gray-500">Quiz Question</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
          {showResult && (
            <button
              onClick={resetQuestion}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Try again"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">{question}</h3>

      {renderQuestionContent()}

      <div className="mt-6 flex items-center justify-between">
        <div>
          {showResult && explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                <span className="font-semibold">Explanation:</span> {explanation}
              </p>
            </div>
          )}
        </div>

        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Submit Answer
          </button>
        )}
      </div>

      {showResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          isCorrect() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {isCorrect() ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <XCircle className="text-red-600" size={20} />
            )}
            <span className={`font-medium ${
              isCorrect() ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCorrect() ? 'Correct! Well done!' : 'Incorrect. Try again!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;