
import React from 'react';
import { CheckCircle, Clock, TestTube, FileText } from 'lucide-react';

interface StatusTrackerProps {
    status: string;
    reportStatus: string;
}

const stages = [
    { id: 'collected', label: 'Specimen Taken', color: 'bg-blue-500', icon: TestTube, statuses: ['sample_collected', 'reached', 'processing', 'completed', 'report_uploaded'] },
    { id: 'lab', label: 'In Lab', color: 'bg-purple-500', icon: Clock, statuses: ['reached', 'processing', 'completed', 'report_uploaded'] },
    { id: 'processing', label: 'Test Pending', color: 'bg-amber-500', icon: FileText, statuses: ['processing', 'completed', 'report_uploaded'] },
    { id: 'signoff', label: 'Pending Approval', color: 'bg-orange-500', icon: CheckCircle, statuses: ['pending_review', 'completed', 'report_uploaded'] } // Mapping reportStatus here
];

const StatusTracker: React.FC<StatusTrackerProps> = ({ status, reportStatus }) => {

    const getCurrentStageIndex = () => {
        // Logic to determine progress based on booking status and report status
        if (status === 'report_uploaded' || status === 'completed') return 4; // All done (or at least Signoff pending)
        if (reportStatus === 'pending_review' && status !== 'pending') return 3;
        if (status === 'processing') return 2;
        if (status === 'reached') return 1;
        if (status === 'sample_collected') return 0;
        return -1; // Not started
    };

    const currentStage = getCurrentStageIndex();

    return (
        <div className="w-full mt-4 mb-2">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>

                {/* Progress Line */}
                <div
                    className="absolute left-0 top-1/2 h-1 bg-slate-100 -z-10 rounded-full transition-all duration-500"
                    style={{
                        width: `${Math.max(0, (currentStage / (stages.length - 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                    }}
                ></div>

                {stages.map((stage, idx) => {
                    const isCompleted = idx <= currentStage;
                    const isCurrent = idx === currentStage;

                    return (
                        <div key={stage.id} className="flex flex-col items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                    ${isCompleted ? `${stage.color} border-white shadow-md text-white` : 'bg-slate-50 border-white text-slate-300'}
                  `}
                            >
                                <stage.icon size={12} strokeWidth={3} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-slate-700' : 'text-slate-300'}`}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusTracker;
