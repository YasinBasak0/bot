import * as React from 'react'

const Avatar = ({ name, avatarUrl, height, width, isEmulator }: AvatarProps) => {
  const className = `bpw-bot-avatar${isEmulator ? ' emulator' : ''}`

  return (
    <div className={className}>
      {avatarUrl && <img height={height} width={width} src={avatarUrl} />}
      {!avatarUrl &&
        (isEmulator ? (
          <svg width={10} height={10} viewBox="0 0 320 365">
            <path
              fill="#fff"
              d="M286.73,235.91,311,249.5a17.65,17.65,0,0,1,9,15.64v54.49a17.64,17.64,0,0,1-9,15.64l-23.55,13.62-23.55,13.62a17.56,17.56,0,0,1-18,0l-23.55-13.62-23.55-13.62a17.64,17.64,0,0,1-9-15.64V270.94a4.51,4.51,0,0,0-2.19-3.86L80.23,202.67a1,1,0,0,0-1.35,1.41l19,28.85a4.51,4.51,0,0,1-1.29,6.23l-.17.11L74.14,252.5a17.56,17.56,0,0,1-18,0L32.56,238.88,9,225.26a17.65,17.65,0,0,1-9-15.64V155.13a17.65,17.65,0,0,1,9-15.64l23.55-13.62,23.55-13.62a17.56,17.56,0,0,1,18,0l23.55,13.62,18.48,10.69a4.49,4.49,0,0,0,4.51,0L187.5,97.91a4.51,4.51,0,0,0,2.25-3.9V45.37a17.65,17.65,0,0,1,9-15.64l23.55-13.62L245.86,2.49a17.56,17.56,0,0,1,18,0l23.55,13.62L311,29.73a17.65,17.65,0,0,1,9,15.64V99.86a17.65,17.65,0,0,1-9,15.64l-23.55,13.62-23.55,13.62a17.56,17.56,0,0,1-18,0L223.14,129.6a2.15,2.15,0,0,1-1-1.42,2.27,2.27,0,0,1,.33-1.74l20.92-31.29a1,1,0,0,0-.27-1.39,1,1,0,0,0-1.06,0l-40.46,23.4-69.07,40a4.51,4.51,0,0,0-2.25,3.9v43a4.51,4.51,0,0,0,2.25,3.9l66.82,38.65a4.49,4.49,0,0,0,4.51,0l18.48-10.69,23.55-13.62a17.56,17.56,0,0,1,18,0l22.73,13.59Z"
            />
          </svg>
        ) : (
          <svg width={width} height={width}>
            <text textAnchor={'middle'} x={'50%'} y={'50%'} dy={'0.35em'} fill={'#ffffff'} fontSize={15}>
              {name[0]}
            </text>
          </svg>
        ))}
    </div>
  )
}

export default Avatar

export interface AvatarProps {
  name: string
  avatarUrl: string
  isEmulator?: boolean
  height: number
  width: number
}