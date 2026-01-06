
import React from 'react';
import { CheckCircle, Clock, TestTube, FileText } from 'lucide-react';

interface StatusTrackerProps {
    status: string;
    reportStatus: string;
}

const stages = [
    { id: 'assigned', label: 'Assigned', color: 'bg-blue-500', icon: CheckCircle, statuses: ['assigned', 'reached', 'sample_collected', 'processing', 'completed', 'report_uploaded'] },
    { id: 'collected', label: 'Specimen Taken', color: 'bg-indigo-500', icon: TestTube, statuses: ['sample_collected', 'processing', 'completed', 'report_uploaded'] },
    { id: 'lab', label: 'In Lab', color: 'bg-purple-500', icon: Clock, statuses: ['processing', 'completed', 'report_uploaded'] },
    { id: 'signoff', label: 'Pending Approval', color: 'bg-orange-500', icon: FileText, statuses: ['report_uploaded', 'completed'] }
];

const StatusTracker: React.FC<StatusTrackerProps> = ({ status, reportStatus }) => {

    const getCurrentStageIndex = () => {
        if (status === 'completed' || status === 'report_uploaded' || (status === 'processing' && reportStatus === 'pending_review')) return 3; // Pending Approval (or Done)
        if (status === 'processing') return 2; // In Lab
        if (status === 'sample_collected') return 1; // Specimen Taken
        if (status === 'assigned' || status === 'reached') return 0; // Assigned
        return -1;
    };

    const currentStage = getCurrentStageIndex();

    return (
        <div className="w-full mt-6 mb-4 px-2">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>

                {/* Progress Line */}
                <div
                    className="absolute left-0 top-1/2 h-1 bg-slate-100 -z-10 rounded-full transition-all duration-500"
                    style={{
                        width: `${Math.max(0, (currentStage / (stages.length - 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #a855f7)' // Blue to Purple
                    }}
                ></div>

                {stages.map((stage, idx) => {
                    const isCompleted = idx <= currentStage;

                    return (
                        <div key={stage.id} className="flex flex-col items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10 bg-white
                    ${isCompleted ? `${stage.color} border-white shadow-md text-white` : 'border-slate-200 text-slate-300'}
                  `}
                            >
                                <stage.icon size={12} strokeWidth={3} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${isCompleted ? 'text-slate-700' : 'text-slate-300'}`}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6"></div>
        </div>
    );
};

export default StatusTracker;
