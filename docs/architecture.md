# Architecture

## Overview

Echo OS는 React 기반의 단일 페이지 애플리케이션으로 구현합니다.

전체 시스템은 크게 다음 영역으로 구성합니다.

- Desktop
- Window System
- Application System
- Virtual File System
- System State
- Theme

## Desktop

Desktop은 운영체제의 전체적인 환경을 관리합니다.

주요 구성 요소:

- Wallpaper
- System Bar
- Universal Surface
- Running Windows
- Notifications

## Window System

Window는 공통 Window 시스템을 통해 관리되며, 반드시 특정 Application과 함께 생성될 필요는 없습니다. Generic Window를 먼저 만들고 Application을 연결할 수 있습니다.

Window System은 다음 상태와 동작을 관리합니다.

- Position
- Size
- Focus
- Minimize
- Maximize
- Close

각 애플리케이션이 독립적으로 창을 구현하지 않고 공통 시스템을 사용하도록 합니다.

Universal Surface는 Window와 별개의 공통 진입 interface입니다. 사용자가 결과를 선택한 뒤 필요한 경우 Window를 만들고 Application을 연결합니다.

## Application System

애플리케이션은 App Registry를 통해 등록합니다.

각 애플리케이션은 고유한 ID와 메타데이터를 가지며, Window에 기능을 제공할 수 있습니다. Application이 항상 사용자 경험의 출발점일 필요는 없습니다.

초기 애플리케이션:

- About
- Files

이후 필요에 따라 Settings, Terminal 등의 애플리케이션을 추가합니다.

## Virtual File System

실제 운영체제의 파일 시스템을 사용하지 않습니다.

브라우저 내부에서 동작하는 Virtual File System을 구현하며, 파일과 디렉터리의 구조와 기본적인 조작을 제공합니다.

Virtual File System과 File Manager UI는 서로 독립적으로 유지합니다.

## State Management

전역 상태는 실제로 여러 시스템에서 공유해야 하는 데이터에만 사용합니다.

주요 전역 상태:

- Window State
- System Settings
- Virtual File System
- Application State

가능하면 상태의 소유권을 명확하게 유지하고 불필요한 전역 상태를 만들지 않습니다.

## Data Flow

기본적인 구조는 다음과 같습니다.

Desktop
→ Window Manager
→ Application
→ Application-specific System

예를 들어:

Desktop
→ Window Manager
→ File Manager
→ Virtual File System

애플리케이션은 필요한 시스템 기능을 명확한 인터페이스를 통해 사용합니다.
