import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Lightbulb, Target, CheckCircle } from 'lucide-react';
import CodePlayground from './CodePlayground';

const InteractiveExample = ({
  title,
  description,
  objective,
  initialCode,
  solution,
  hints = [],
  language = 'javascript',
  difficulty = 'beginner'
}) => {
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800', 
    advanced: 'bg-red-100 text-red-800'
  };

  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setHintIndex(hintIndex + 1);
    }
  };

  const markCompleted = () => {
    setCompleted(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="text-blue-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
            {completed && (
              <CheckCircle className="text-green-600" size={20} />
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mt-3">{description}</p>
        
        {objective && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 font-medium text-sm">
              <span className="font-semibold">Objective:</span> {objective}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Content */}
      <div className="p-6">
        <CodePlayground 
          initialCode={initialCode}
          language={language}
          title={`${title} - Try it yourself`}
        />

        {/* Hints Section */}
        {hints.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              <Lightbulb size={16} />
              <span>Need a hint?</span>
              {showHints ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {showHints && (
              <div className="mt-3 space-y-3">
                {hints.slice(0, hintIndex + 1).map((hint, index) => (
                  <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 text-sm">
                      <span className="font-semibold">Hint {index + 1}:</span> {hint}
                    </p>
                  </div>
                ))}
                
                {hintIndex < hints.length - 1 && (
                  <button
                    onClick={showNextHint}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Show next hint →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Solution Section */}
        <div className="mt-6">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 font-medium"
          >
            <span>View Solution</span>
            {showSolution ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {showSolution && (
            <div className="mt-3">
              <CodePlayground 
                initialCode={solution}
                language={language}
                title="Solution"
                editable={false}
              />
            </div>
          )}
        </div>

        {/* Completion Button */}
        {!completed && (
          <div className="mt-6 text-center">
            <button
              onClick={markCompleted}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Mark as Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveExample;