# Architecture

## Overview

Echo OS는 React 기반의 단일 페이지 애플리케이션으로 구현합니다.

현재 시스템은 크게 다음 영역으로 구성됩니다.

- Desktop
- Universal Surface
- Window System
- Application System
- Item Execution
- Virtual File System
- Recent Items
- Taskbar
- System State

Echo OS의 내부 아키텍처는 Application, Window, VFS 등의 시스템 구조를 유지하지만, 이러한 내부 구조가 사용자에게 그대로 노출될 필요는 없습니다.

특히 Application을 모든 작업의 시작점이나 Window의 필수 소유자로
가정하지 않습니다.

## Desktop

Desktop은 Echo OS의 주요 시스템 구성 요소를 연결하는 최상위 환경입니다.

현재 다음과 같은 역할을 담당합니다.

- Universal Surface 연결
- Window System 연결
- Application Registry 연결
- VFS Item 수집
- Item 실행 정책
- Recent Item state
- Desktop-level interaction
- Taskbar 연결

Desktop은 개별 Application의 UI를 직접 구현하지 않지만, 여러 시스템 사이의 공통 동작이 필요한 경우 이를 조정합니다.

현재 Item 실행은 이러한 system-level responsibility 중 하나입니다.

## Universal Surface

Universal Surface는 Window나 Application과 독립된 공통 진입 interface입니다.

Surface는 현재 다음 결과 유형을 지원합니다.

- Item
- Application
- Action

검색어가 없을 때는 Recent Items를 표시합니다.

검색어가 있을 때는 검색 가능한 Item, Application, Action을 하나의 interface에서 탐색할 수 있습니다.

Surface 자체는 Item의 실행 방법을 결정하지 않습니다.

Item을 선택하면 실행 요청을 Desktop의 공통 Item execution path로 전달합니다.

Application 결과를 선택한 경우에는 필요한 Window를 만들고 해당 Application을 연결합니다.

Application Registry에 존재한다고 해서 모든 Application이 Surface에 노출되는 것은 아닙니다.

## Window System

Window는 공통 Window System을 통해 관리합니다.

Window System은 현재 다음 상태와 동작을 관리합니다.

- Position
- Size
- Focus
- Z-order
- Minimize
- Maximize
- Restore
- Close

각 Application이 독립적인 Window 구현을 가지지 않고 공통 Window System을 사용합니다.

Window는 반드시 특정 Application과 함께 생성될 필요가 없습니다.

Generic Window를 먼저 생성한 뒤 필요한 Application을 연결할 수 있으며, Window state의 `appId`는 optional입니다.

현재 Window에는 필요에 따라 Application 실행 context를 전달하기 위한 정보도 포함될 수 있습니다.

예:

- `initialPath`
- `initialItemPath`

`initialPath`는 Files의 초기 directory 위치에 사용하며, `initialItemPath`는 특정 Item을 Application에 전달하는 데 사용합니다.

두 값은 서로 다른 의미를 가지므로 하나의 path state로 통합하지 않습니다.

## Application System

Application은 중앙 App Registry를 통해 등록합니다.

각 Application은 stable ID와 필요한 metadata를 가집니다.

현재 metadata에는 다음과 같은 정보가 포함될 수 있습니다.

- ID
- Name
- Icon
- Component
- Single-instance behavior
- Surface visibility

현재 주요 Application은 다음과 같습니다.

- About
- Files
- Text Viewer

Application은 Window에 기능을 제공하지만, 항상 사용자 경험의 직접적인 시작점일 필요는 없습니다.

예를 들어 Text Viewer는 Registry에 등록된 Application이지만 Surface의 Application 검색 결과에는 직접 노출되지 않습니다.

대신 `.txt` Item이 실행될 때 system-level Item execution policy를 통해 Text Viewer가 연결됩니다.

따라서 다음 관계를 전제로 하지 않습니다.

Application = Surface Entry = Window Owner

각 역할은 필요한 경우 서로 독립적으로 존재할 수 있습니다.

## Item Execution

Item 실행 정책은 Desktop 수준에서 공통으로 관리합니다.

현재 Surface와 Files가 각각 독립적인 file execution rule을 가지지 않고 동일한 Item execution path를 사용합니다.

현재 실행 정책은 의도적으로 작게 유지합니다.

```text
directory
→ Files

.txt file
→ Text Viewer

unsupported file
→ no execution
```

Surface에서 Item을 선택하면 공통 Item execution path로 전달합니다.

Files에서 file을 double-click한 경우에도 같은 경로를 사용합니다.

따라서 Files는 `.txt`가 Text Viewer로 열린다는 사실을 알 필요가 없습니다.

다만 모든 Item interaction을 강제로 동일하게 처리하지는 않습니다.

예를 들어 directory는 context에 따라 다음과 같이 동작합니다.

```text
Surface → directory
→ Files Window에서 해당 directory 열기

Files → directory double-click
→ 현재 Files Window 안에서 directory 탐색
```

공통 abstraction을 위해 자연스러운 context-specific interaction을 제거하지 않습니다.

현재는 MIME, Handler Registry, Open With 등의 일반화된 실행 시스템을 구현하지 않습니다.

## Virtual File System

Echo OS는 사용자의 실제 파일 시스템에 의존하지 않습니다.

현재 브라우저 내부에서 동작하는 Virtual File System을 사용합니다.

VFS는 다음과 같은 기본 구조를 표현합니다.

- Files
- Directories
- Paths
- File content

Virtual File System과 Files UI는 서로 독립적으로 유지합니다.

현재 VFS state model은 단순한 prototype 수준이며, Desktop과 각 Files instance가 완전한 shared filesystem state를 사용하는 구조는 아직 구현하지 않았습니다.

읽기와 탐색 중심의 현재 기능에서는 이 구조를 유지합니다.

향후 editing 등 실제 shared state가 필요한 기능이 생길 경우 그 요구사항을 기준으로 VFS state ownership을 다시 평가합니다.

## Files

Files는 VFS를 탐색하는 Application입니다.

현재 주요 navigation state는 다음과 같습니다.

- Current working directory
- Back history
- Forward history
- Selection

Files는 다음 navigation을 지원합니다.

- Directory double-click
- Up
- Back
- Forward

Window의 `initialPath`가 제공되면 해당 directory에서 시작할 수 있습니다.

File double-click의 실행 정책은 Files 내부에 구현하지 않습니다.

Files는 선택된 file의 path와 최소 Item 정보를 system-level Item execution callback으로 전달합니다.

이를 통해 Files는 특정 file type이나 해당 Application에 직접 의존하지 않습니다.

## Recent Items

Recent는 현재 Desktop의 in-memory state로 관리합니다.

현재 Recent의 정의는 다음과 같습니다.

> Recent = 공통 Item execution path를 통해 성공적으로 실행된 최근 Item

Recent는 현재 다음을 기록하지 않습니다.

- Application launch
- Window history
- Files navigation history
- 일반적인 activity history

지원되는 Item이 성공적으로 실행된 경우에만 Recent에 기록합니다.

현재 Item identity는 VFS path를 사용합니다.

동일한 path의 Item을 다시 실행하면 중복 항목을 생성하지 않고 기존 항목을 최상단으로 이동시키는 MRU 방식으로 동작합니다.

Recent의 최대 항목 수는 현재 5개입니다.

Recent Item을 다시 선택했을 때 별도의 실행 정책을 사용하지 않습니다.

다시 동일한 Item execution path로 전달합니다.

```text
Recent
→ Item execution
→ Application / capability
→ Window
```

Recent는 현재 in-memory prototype 기능이므로 페이지를 새로고침하면 초기화됩니다.

현재 다음 persistence 시스템은 사용하지 않습니다.

- localStorage
- sessionStorage
- IndexedDB
- backend storage

## Taskbar

Taskbar는 현재 실행 중인 Window를 표시하고 Window-level interaction을 제공합니다.

현재 고정 Application launcher는 사용자 흐름의 중심으로 사용하지 않습니다.

Taskbar의 주요 역할은 이미 실행 중인 Window의 상태를 보여주고 minimized Window로 다시 접근할 수 있도록 하는 것입니다.

Application Registry와 Taskbar의 사용자 노출 구조는 서로 동일할 필요가 없습니다.

## State Management

State는 가능한 한 실제 소유권이 있는 component 또는 system 가까이에 둡니다.

현재 주요 state ownership의 예는 다음과 같습니다.

```text
Window Manager
→ Window state

Desktop
→ Recent Items
→ system-level Item execution coordination

Files
→ cwd
→ Back/Forward history
→ selection

Universal Surface
→ query
→ result selection
→ transient Surface interaction
```

여러 시스템에서 실제로 공유할 필요가 생기기 전까지 state를 불필요하게 global로 승격하지 않습니다.

현재 구조가 실제 요구사항을 충족하는 동안에는 별도의 state-management framework를 도입하지 않습니다.

## Current Data Flow

Echo OS에는 하나의 Application-centric data flow만 존재하지 않습니다.

사용자의 진입 context에 따라 여러 시스템이 연결됩니다.

### Item from Surface

```text
Universal Surface
→ Item
→ Desktop.executeItem()
→ Generic Window
→ Application attachment
→ Item content / directory
→ Recent
```

### File from Files

```text
Files
→ File double-click
→ onOpenItem()
→ Desktop.executeItem()
→ Generic Window
→ Application attachment
→ Item content
→ Recent
```

### Directory inside Files

```text
Files
→ Directory double-click
→ Files.enter()
→ Current Files Window navigation
```

### Application from Surface

```text
Universal Surface
→ Application
→ Generic Window
→ Application attachment
```

Application launch 자체는 현재 Recent Item에 기록하지 않습니다.

### Recent Item

```text
Universal Surface
→ Recent Item
→ Desktop.executeItem()
→ Application / capability
→ Window
→ Recent MRU update
```

이 구조를 통해 Surface, Files, Recent가 서로 다른 진입점으로 존재하면서도 실제 Item execution policy는 한 곳에서 공유합니다.

## Current Boundaries

현재 architecture에서 의도적으로 일반화하지 않은 영역이 있습니다.

다음은 아직 구현하지 않습니다.

- MIME-based file handling
- Handler Registry
- Open With
- Shared persistent VFS state
- Stable Item ID
- Recent persistence
- General Capability system
- Workspace system
- Tab system
- Process model

이러한 구조는 미래에 필요할 가능성이 있다는 이유만으로 미리 추가하지 않습니다.

실제 prototype interaction에서 구체적인 필요가 발생했을 때 현재 architecture를 확장합니다.

## Architectural Principle

Echo OS의 architecture는 사용자-facing concept를 지원하기 위한 내부 구현 구조입니다.

내부에 Application, Window Manager, Registry, VFS가 존재한다고 해서 사용자도 반드시 같은 구조를 통해 작업해야 하는 것은 아닙니다.

따라서 architecture를 설계할 때 다음을 구분합니다.

```text
Internal System Structure
≠
User-facing Interaction Structure
```

공통 책임이 실제로 여러 곳에서 반복될 때는 작은 abstraction을 만들되, 미래의 가능성만을 위해 범용 framework를 먼저 만들지 않습니다.
