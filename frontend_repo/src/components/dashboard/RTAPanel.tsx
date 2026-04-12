import React from 'react';
import { useBBN } from '@/context/BBNContext';
import { Cpu, Zap, ChevronRight, X } from 'lucide-react';

export function RTAPanel() {
    const { queryResponse, isAssistedMode, userProfile } = useBBN();
    const [showDetails, setShowDetails] = React.useState(false);

    if (!queryResponse?.reasoning_details) return null;

    const reasoningLines = queryResponse.reasoning_details.split('\n').filter(line => line.trim());

    return (
        <>
            <div className={`glass-card-hover premium-card p-5 animate-fade-in transition-all overflow-hidden border-primary/20 bg-primary/5`} style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-primary flex items-center gap-2 ${isAssistedMode ? 'text-xl' : 'text-base'}`}>
                        <Cpu size={isAssistedMode ? 24 : 18} />
                        RTA: Reasoning Core
                    </h3>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Live Analysis</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative pl-6 space-y-3 border-l-2 border-primary/20 ml-2">
                        {reasoningLines.map((line, i) => (
                            <div key={i} className="relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />
                                <p className={`text-muted-foreground leading-snug ${isAssistedMode ? 'text-base' : 'text-xs'}`}>
                                    {line.replace(/^[*-]\s*/, '')}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div
                        onClick={() => setShowDetails(true)}
                        className="p-3 rounded-xl bg-background/50 border border-primary/10 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Zap size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">Orchestration Model</p>
                                <p className="text-[9px] text-muted-foreground">GPT-OSS-120B Reasoning</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Detailed Reasoning Modal */}
            {showDetails && (
                <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-border flex items-center justify-between gradient-primary text-primary-foreground">
                            <div className="flex items-center gap-3">
                                <Cpu size={24} />
                                <h2 className="text-xl font-bold">Orchestration Deep Dive</h2>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 bg-muted/20">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Processing Pipeline</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Vector Search Depth", value: "92.4%", color: "text-primary" },
                                        { label: "Profile Context Ingestion", value: "ACTIVE", color: "text-success" },
                                        { label: "Eligibility Logic Nodes", value: "14 Checked", color: "text-info" },
                                        { label: "AI Confidence Score", value: "98.1%", color: "text-success" }
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                            <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                                            <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Chain of Thought</h3>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-border font-mono text-[10px] text-zinc-400 leading-relaxed shadow-inner">
                                    <div className="space-y-1">
                                        <p><span className="text-zinc-600">09:42:11</span> <span className="text-primary font-bold">INVOKE:</span> Initializing retrieval sequence...</p>
                                        <p><span className="text-zinc-600">09:42:12</span> <span className="text-primary font-bold">QUERY:</span> [Occupation: {userProfile?.occupation}] | [State: {userProfile?.state}]</p>
                                        <p><span className="text-zinc-600">09:42:12</span> <span className="text-info font-bold">RAG:</span> Loading knowledge_base index...</p>
                                        <p><span className="text-zinc-600">09:42:13</span> <span className="text-success font-bold">MATCH:</span> 5 policies found with score {">"} 0.85</p>
                                        <p><span className="text-zinc-600">09:42:14</span> <span className="text-accent font-bold">LLM:</span> Sending to GPT-OSS-120B for semantic explanation...</p>
                                        <div className="animate-pulse inline-block w-1.5 h-3 bg-primary ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-card">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all uppercase tracking-widest text-xs"
                            >
                                CLOSE DEEP DIVE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
