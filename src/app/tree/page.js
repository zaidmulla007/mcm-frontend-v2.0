"use client";
import { useState, useRef, useEffect } from "react";
import { FaYoutube, FaTelegramPlane } from "react-icons/fa";

// Sample post
const samplePost = {
    content: "📢 According to River, 14 of the 25 largest US banks are currently developing Bitcoin-related products for their customers.",
    originalSource: "River Research",
    date: "Dec 16, 2024 09:15 AM"
};

// Tree structure
const propagationTree = {
    id: "a",
    name: "CryptoKing",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    timestamp: "Dec 16, 2024 09:15 AM",
    platform: "youtube",
    children: [
        {
            id: "b",
            name: "BitcoinBull",
            image: "https://randomuser.me/api/portraits/men/32.jpg",
            timestamp: "Dec 16, 2024 09:23 AM",
            platform: "telegram",
            children: []
        },
        {
            id: "c",
            name: "CryptoQueen",
            image: "https://randomuser.me/api/portraits/women/44.jpg",
            timestamp: "Dec 16, 2024 09:31 AM",
            platform: "youtube",
            children: [
                {
                    id: "g",
                    name: "TokenTina",
                    image: "https://randomuser.me/api/portraits/women/56.jpg",
                    timestamp: "Dec 16, 2024 10:18 AM",
                    platform: "telegram",
                    children: []
                }
            ]
        },
        {
            id: "e",
            name: "AltcoinAlpha",
            image: "https://randomuser.me/api/portraits/men/45.jpg",
            timestamp: "Dec 16, 2024 09:45 AM",
            platform: "youtube",
            children: [
                {
                    id: "d",
                    name: "DeFiDave",
                    image: "https://randomuser.me/api/portraits/men/67.jpg",
                    timestamp: "Dec 16, 2024 10:02 AM",
                    platform: "telegram",
                    children: []
                }
            ]
        },
        {
            id: "f",
            name: "SatoshiSam",
            image: "https://randomuser.me/api/portraits/men/89.jpg",
            timestamp: "Dec 16, 2024 10:52 AM",
            platform: "youtube",
            children: []
        }
    ]
};

export default function TreePage() {
    const containerRef = useRef(null);
    const nodeRefs = useRef({});
    const [lines, setLines] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const calculateLines = () => {
            const newLines = [];
            const container = containerRef.current;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();

            const traverse = (node) => {
                const parentEl = nodeRefs.current[node.id];
                if (!parentEl) return;

                const parentRect = parentEl.getBoundingClientRect();
                // Line starts from bottom center of parent (after timestamp)
                const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
                const parentBottomY = parentRect.top - containerRect.top + parentRect.height;

                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => {
                        const childEl = nodeRefs.current[child.id];
                        if (childEl) {
                            const childRect = childEl.getBoundingClientRect();
                            // Line ends at top center of child (above circle)
                            const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
                            const childTopY = childRect.top - containerRect.top;

                            newLines.push({
                                x1: parentCenterX,
                                y1: parentBottomY,
                                x2: childCenterX,
                                y2: childTopY,
                                key: `${node.id}-${child.id}`
                            });
                        }
                        traverse(child);
                    });
                }
            };

            traverse(propagationTree);
            setLines(newLines);
        };

        const timer = setTimeout(calculateLines, 100);
        window.addEventListener('resize', calculateLines);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateLines);
        };
    }, [mounted]);

    const registerRef = (id, el) => {
        if (el) {
            nodeRefs.current[id] = el;
        }
    };

    // Single node component
    const TreeNode = ({ node }) => {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                ref={(el) => registerRef(node.id, el)}
                className="flex flex-col items-center group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image container with platform badge */}
                <div className="relative">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 transform ${isHovered ? 'scale-125 shadow-2xl' : 'scale-100 shadow-lg'
                            }`}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: '3px solid rgba(255, 255, 255, 0.9)',
                            boxShadow: isHovered
                                ? '0 20px 40px rgba(102, 126, 234, 0.4), 0 0 0 4px rgba(102, 126, 234, 0.2)'
                                : '0 10px 20px rgba(102, 126, 234, 0.3)',
                        }}
                    >
                        {node.image && !imageError ? (
                            <img
                                src={node.image}
                                alt={node.name}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <span className="text-white font-bold text-xl uppercase">
                                {node.id}
                            </span>
                        )}
                    </div>
                    {/* Platform badge - bottom right */}
                    <div
                        className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform ${node.platform === 'youtube'
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            } ${isHovered ? 'scale-125 rotate-12' : 'scale-100'}`}
                        style={{
                            border: '2px solid white',
                        }}
                    >
                        {node.platform === 'youtube' ? (
                            <FaYoutube className="text-white text-sm" />
                        ) : (
                            <FaTelegramPlane className="text-white text-sm" />
                        )}
                    </div>
                </div>
                <span className={`mt-2 text-sm font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'
                    }`}>
                    {node.name}
                </span>
                <span className="text-xs text-gray-500 font-medium">{node.timestamp}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans py-10">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8 animate-fade-in items-start">
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight drop-shadow-lg">
                        <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Post Spread Timeline
                        </span>
                    </h1>
                    <div className="w-32 h-1 bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 rounded-full mt-2"></div>
                </div>

                {/* Post Card */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-xl transform hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">📰</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-base font-bold text-gray-900">{samplePost.originalSource}</span>
                                    <span className="text-sm text-gray-500">• {samplePost.date}</span>
                                </div>
                                <p className="text-base text-gray-700 leading-relaxed">{samplePost.content}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tree with diagonal lines */}
                <div ref={containerRef} className="relative bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/60" style={{ minHeight: '500px' }}>
                    {/* SVG for diagonal lines */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 0 }}
                    >
                        <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                        {lines.map((line) => (
                            <line
                                key={line.key}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="url(#lineGradient)"
                                strokeWidth="2"
                            />
                        ))}
                    </svg>

                    {/* Tree Layout */}
                    <div className="relative flex flex-col items-center gap-16" style={{ zIndex: 1 }}>
                        {/* Level 1 - Root (a) */}
                        <div className="flex justify-center">
                            <TreeNode node={propagationTree} />
                        </div>

                        {/* Level 2 - Children of root (b, c, e, f) */}
                        <div className="flex justify-center gap-20 flex-wrap">
                            {propagationTree.children.map((child) => (
                                <TreeNode key={child.id} node={child} />
                            ))}
                        </div>

                        {/* Level 3 - Grandchildren (g under c, d under e) */}
                        <div className="flex justify-center gap-16 flex-wrap">
                            {propagationTree.children.map((child) => (
                                child.children && child.children.length > 0 ? (
                                    child.children.map((grandchild) => (
                                        <TreeNode key={grandchild.id} node={grandchild} />
                                    ))
                                ) : null
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }
            `}</style>
        </div>
    );
}
