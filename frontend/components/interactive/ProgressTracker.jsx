import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trophy, Star, Clock } from 'lucide-react';

const ProgressTracker = ({ 
  chapters = [],
  currentChapter = 0,
  onChapterSelect,
  showStats = true 
}) => {
  const [completedChapters, setCompletedChapters] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    // Load progress from localStorage
    const saved = localStorage.getItem('tutorial-progress');
    if (saved) {
      const progress = JSON.parse(saved);
      setCompletedChapters(progress.completed || []);
      setTimeSpent(progress.timeSpent || 0);
    }
  }, []);

  useEffect(() => {
    // Track time spent
    if (currentChapter >= 0) {
      setStartTime(Date.now());
      
      return () => {
        if (startTime) {
          const sessionTime = Math.floor((Date.now() - startTime) / 1000);
          setTimeSpent(prev => prev + sessionTime);
        }
      };
    }
  }, [currentChapter]);

  useEffect(() => {
    // Save progress to localStorage
    localStorage.setItem('tutorial-progress', JSON.stringify({
      completed: completedChapters,
      timeSpent: timeSpent
    }));
  }, [completedChapters, timeSpent]);

  const markChapterComplete = (chapterIndex) => {
    if (!completedChapters.includes(chapterIndex)) {
      setCompletedChapters([...completedChapters, chapterIndex]);
    }
  };

  const getProgressPercentage = () => {
    return chapters.length > 0 ? (completedChapters.length / chapters.length) * 100 : 0;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEstimatedTimeRemaining = () => {
    const avgTimePerChapter = completedChapters.length > 0 ? timeSpent / completedChapters.length : 15 * 60; // 15 min default
    const remainingChapters = chapters.length - completedChapters.length;
    return Math.floor(avgTimePerChapter * remainingChapters);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
          <div className="flex items-center space-x-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="text-sm font-medium text-gray-600">
              {completedChapters.length}/{chapters.length}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="text-blue-500" size={16} />
              </div>
              <div className="text-sm font-medium text-gray-900">{formatTime(timeSpent)}</div>
              <div className="text-xs text-gray-500">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="text-yellow-500" size={16} />
              </div>
              <div className="text-sm font-medium text-gray-900">{completedChapters.length}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Circle className="text-gray-400" size={16} />
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatTime(getEstimatedTimeRemaining())}
              </div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List */}
      <div className="p-4">
        <div className="space-y-2">
          {chapters.map((chapter, index) => {
            const isCompleted = completedChapters.includes(index);
            const isCurrent = index === currentChapter;
            const isAccessible = index === 0 || completedChapters.includes(index - 1);

            return (
              <button
                key={index}
                onClick={() => isAccessible && onChapterSelect && onChapterSelect(index)}
                disabled={!isAccessible}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50'
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : isAccessible
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <Circle 
                        className={`${
                          isAccessible ? 'text-gray-400' : 'text-gray-300'
                        }`} 
                        size={20} 
                      />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        isAccessible ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Chapter {index + 1}
                      </h4>
                      {isCurrent && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      isAccessible ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {chapter.title || chapter.name || `Chapter ${index + 1}`}
                    </p>
                    {chapter.estimatedTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        ~{chapter.estimatedTime}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <button
            onClick={() => markChapterComplete(currentChapter)}
            disabled={completedChapters.includes(currentChapter)}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {completedChapters.includes(currentChapter) ? 'Completed ✓' : 'Mark Complete'}
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem('tutorial-progress');
              setCompletedChapters([]);
              setTimeSpent(0);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;