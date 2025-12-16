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

        return (
            <div
                ref={(el) => registerRef(node.id, el)}
                className="flex flex-col items-center"
            >
                {/* Image container with platform badge */}
                <div className="relative">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-transform hover:scale-110"
                        style={{
                            backgroundColor: '#b8d4f0',
                            border: '2px solid #7eb3e0',
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
                            <span className="text-gray-600 font-medium text-lg lowercase">
                                {node.id}
                            </span>
                        )}
                    </div>
                    {/* Platform badge - bottom right */}
                    <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${node.platform === 'youtube'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                            }`}
                    >
                        {node.platform === 'youtube' ? (
                            <FaYoutube className="text-white text-[10px]" />
                        ) : (
                            <FaTelegramPlane className="text-white text-[10px]" />
                        )}
                    </div>
                </div>
                <span className="mt-1 text-xs font-semibold text-gray-700">{node.name}</span>
                <span className="text-[10px] text-gray-500">{node.timestamp}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white font-sans py-6">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-4">
                    <p className="text-2xl font-bold text-gray-800">Post Spread Timeline</p>
                </div>

                {/* Post Card */}
                <div className="max-w-xl mx-auto mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg">📰</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-800">{samplePost.originalSource}</span>
                                <span className="text-xs text-gray-400">• {samplePost.date}</span>
                            </div>
                            <p className="text-sm text-gray-700">{samplePost.content}</p>
                        </div>
                    </div>
                </div>

                {/* Tree with diagonal lines */}
                <div ref={containerRef} className="relative" style={{ minHeight: '400px' }}>
                    {/* SVG for diagonal lines */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 0 }}
                    >
                        {lines.map((line) => (
                            <line
                                key={line.key}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="#333"
                                strokeWidth="1.5"
                            />
                        ))}
                    </svg>

                    {/* Tree Layout */}
                    <div className="relative flex flex-col items-center gap-12" style={{ zIndex: 1 }}>
                        {/* Level 1 - Root (a) */}
                        <div className="flex justify-center">
                            <TreeNode node={propagationTree} />
                        </div>

                        {/* Level 2 - Children of root (b, c, e, f) */}
                        <div className="flex justify-center gap-16">
                            {propagationTree.children.map((child) => (
                                <TreeNode key={child.id} node={child} />
                            ))}
                        </div>

                        {/* Level 3 - Grandchildren (g under c, d under e) */}
                        <div className="flex justify-center gap-8">
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
        </div>
    );
}
