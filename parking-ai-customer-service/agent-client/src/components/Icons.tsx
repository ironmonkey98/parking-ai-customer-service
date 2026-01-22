import React from 'react';

interface IconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};

// 品牌图标 - P 字母
export const ParkingIcon: React.FC<IconProps> = ({ size = 'lg', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M9 4v16h2v-6h3c2.76 0 5-2.24 5-5s-2.24-5-5-5H9zm2 2h3c1.65 0 3 1.35 3 3s-1.35 3-3 3h-3V6z"/>
  </svg>
);

// 电话图标 - 来电/待接入
export const PhoneIncomingIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="16 2 16 8 22 8" />
    <line x1="23" y1="1" x2="16" y2="8" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// 麦克风图标
export const MicrophoneIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// 信号图标 - RTC 状态
export const SignalIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20V8" />
    <path d="M22 20V4" />
  </svg>
);

// 消息图标
export const MessageSquareIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// 用户图标
export const UserIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// 机器人图标
export const BotIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

// 剪贴板列表图标 - 系统事件
export const ClipboardListIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

// 图表图标 - 统计
export const ChartBarIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// 时钟图标
export const ClockIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// 用户队列图标
export const UsersQueueIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// 钥匙图标 - 关键词触发
export const KeyIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

// 收件箱图标 - 空状态
export const InboxIcon: React.FC<IconProps> = ({ size = 'xl', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

// 警告三角图标
export const AlertTriangleIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// 勾选圆圈图标 - 已连接
export const CheckCircleIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// 加载图标 - 连接中
export const LoaderIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} animate-spin`}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

// 圆圈图标 - 待机
export const CircleIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

// 帮助圆圈图标 - 未知
export const HelpCircleIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// 退出图标
export const LogOutIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// 挂断图标
export const PhoneOffIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);

// 麦克风关闭图标
export const MicOffIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// 警告图标 - 错误提示
export const AlertIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

// 沙漏图标 - 排队等待
export const HourglassIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </svg>
);

// 秒表图标 - 时长统计
export const TimerIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2" />
    <path d="M5 3L2 6" />
    <path d="M22 6l-3-3" />
    <path d="M12 2v2" />
  </svg>
);

// 广播信号图标 - RTC 连接
export const BroadcastIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

// 卫星天线图标 - 等待接入状态
export const SatelliteIcon: React.FC<IconProps> = ({ size = 'xl', className = '' }) => (
  <svg
    width={sizeMap[size]}
    height={sizeMap[size]}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M13 7L9 3 5 7l4 4" />
    <path d="M17 11l4 4-4 4-4-4" />
    <path d="M8 12l4 4" />
    <path d="M16 8l-8 8" />
    <circle cx="18" cy="18" r="3" />
    <path d="M4.9 19.1C2 16.2 2 11.8 4.9 8.9" />
    <path d="M7.8 16.2a5 5 0 0 1 0-8.4" />
  </svg>
);
