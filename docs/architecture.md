# Architecture

## Overview

Echo OS는 React와 TypeScript를 기반으로 Vite에서 실행되는
Single Page Application입니다.

이 문서는 Echo OS의 현재 구현 구조와 주요 system responsibility,
state ownership, component relationship을 설명합니다.

프로젝트의 개념적 목표는 `concept.md`를,
Interaction과 UI의 판단 기준은 `design.md`를 참고합니다.

`architecture.md`는 현재 구현을 설명하는 living document입니다.

따라서 주요 시스템 구조나 responsibility가 변경되면 이 문서도
현재 구현에 맞게 갱신합니다.

반면 개별 CSS 값, 작은 UI 상태, 일시적인 metadata와 같이 코드에서
쉽게 확인할 수 있고 자주 바뀌는 세부사항은 가능한 한 기록하지
않습니다.

## System Overview

현재 Echo OS의 주요 시스템은 다음과 같습니다.

```text
Desktop
├─ Window System
│  ├─ Surface Windows
│  │  └─ Surface Tabs
│  │     ├─ Universal Search
│  │     ├─ Item Content
│  │     └─ Application Content
│  └─ Application Windows
│
├─ Application Registry
├─ Item Execution
├─ Virtual File System
├─ Recent Items
└─ Taskbar
```

이 구조는 내부 구현 관계를 나타냅니다.

사용자-facing hierarchy가 반드시 이 구조와 동일한 것은 아닙니다.

특히 Application, Window, Surface, Tab, Item은 서로 다른 역할을
가지며 항상 1:1 관계를 이루지 않습니다.

## Desktop

Desktop은 Echo OS의 최상위 runtime environment입니다.

주요 system-level component와 shared state를 연결하고 서로 다른
subsystem 사이에서 공통 coordination이 필요한 동작을 담당합니다.

현재 Desktop 수준에서는 다음과 같은 시스템이 연결됩니다.

- Window System
- Surface creation
- Application Registry
- Item Execution
- Virtual File System
- Recent Items
- Taskbar
- Desktop-level interaction

Desktop은 개별 Application의 내부 UI나 navigation을 직접 구현하지
않습니다.

특정 기능이 여러 subsystem 사이에서 공유되어야 할 때만 Desktop 또는
적절한 system-level layer가 이를 조정합니다.

## Window System

Echo OS의 화면상 작업 공간은 공통 Window System을 통해 관리합니다.

Window System은 다음과 같은 Window-level state와 interaction을
담당합니다.

- Position
- Size
- Focus
- Z-order
- Minimize
- Maximize
- Restore
- Close

WindowManager는 Window의 lifecycle과 ordering을 관리합니다.

개별 Application이나 Surface는 독립적인 Window management system을
구현하지 않고 공통 Window System 위에서 동작합니다.

현재 Window는 하나의 Application과 반드시 1:1로 대응하지 않습니다.

Window는 Surface와 같은 higher-level work context를 표시할 수도 있고,
Application을 직접 표시할 수도 있습니다.

Application과 Window의 관계는 현재 interaction에 필요한 방식에 따라
결정됩니다.

## Surface System

Surface는 현재 Echo OS의 주요 work context implementation입니다.

Surface는 Window 안에서 실행되며 하나 이상의 persistent Tab을
포함할 수 있습니다.

```text
Surface Window
→ Surface
→ Tabs
→ Work Targets
```

새 Surface를 만들면 초기 blank Tab을 가진 Surface가 생성됩니다.

Surface는 특정 Application이 소유하는 Window로 취급하지 않습니다.

하나의 Surface 안에서 서로 다른 Item이나 Application을 여러 Tab으로
다룰 수 있습니다.

### Surface State

Surface는 자신의 Tab collection과 현재 활성 Tab을 관리합니다.

개념적으로 주요 state는 다음과 같습니다.

```text
Surface
├─ Tabs
└─ Active Tab
```

각 Tab은 자신이 나타내는 work target과 해당 target을 표시하기 위한
필요한 state를 가질 수 있습니다.

Surface 내부 navigation과 Tab lifecycle은 Surface context 안에서
관리합니다.

### Surface Boundaries

각 Surface는 독립적인 work context입니다.

동일한 Item이 다른 Surface에 열려 있다는 이유만으로 현재 Surface가
자동으로 해당 Surface를 focus하거나 그 Tab을 가져오지 않습니다.

따라서 같은 Item이 여러 Surface에 동시에 존재할 수 있습니다.

현재 Item reuse와 deduplication은 Surface boundary를 넘어서 전역적으로
적용하지 않습니다.

Surface 사이에서 Tab이나 work target을 이동시키는 interaction은
별도의 explicit cross-Surface interaction으로 다룹니다.

## Tab System

Tab은 Surface 내부에서 하나의 work target을 나타냅니다.

Tab은 Application instance와 동일하지 않습니다.

현재 Tab은 상황에 따라 다음과 같은 대상을 나타낼 수 있습니다.

- Blank / discovery state
- File
- Directory
- Application
- 기타 Surface가 표현할 수 있는 work target

Tab의 identity는 가능한 경우 이를 렌더링하는 Application보다 실제
work target을 기준으로 합니다.

예를 들어 Text File을 편집하는 Tab의 주요 identity는 Text Editor라는
Application보다 해당 File입니다.

### Blank Tab

새로운 blank Tab은 아직 특정 work target에 연결되지 않은 상태입니다.

Blank Tab에서는 Universal Search를 통해 다음 작업 대상을 찾거나
실행할 수 있습니다.

검색 또는 discovery를 통해 대상을 선택하면 현재 blank Tab이 해당
work target을 나타내는 Tab으로 전환됩니다.

새로운 target을 위해 항상 새로운 Window를 만드는 것이 아니라 현재
Surface의 Tab context를 활용할 수 있습니다.

### Tab Reuse

동일한 Surface 안에서 이미 열려 있는 Item을 다시 실행하는 경우,
가능한 경우 기존 Tab을 재사용합니다.

```text
Execute Item
→ Search current Surface
→ Existing matching Tab?
   ├─ Yes → activate existing Tab
   └─ No  → open target in Tab
```

이 reuse는 현재 Surface 내부의 work continuity를 위한 정책입니다.

다른 Surface에 같은 Item이 있다는 이유만으로 해당 Surface나 Tab을
자동으로 활성화하지 않습니다.

### Tab Navigation State

특정 Tab은 자신이 나타내는 target에 필요한 navigation state를
소유할 수 있습니다.

예를 들어 Files를 나타내는 Tab은 directory navigation history를
가질 수 있습니다.

이러한 navigation state는 가능한 한 해당 Tab 또는 target context에
가깝게 유지합니다.

모든 Tab의 navigation을 하나의 global history로 통합하지 않습니다.

## Universal Search

Universal Search는 blank Surface Tab에서 work target을 발견하고
실행하기 위한 공통 discovery interface입니다.

현재 Search는 여러 종류의 결과를 하나의 interface에서 다룰 수
있습니다.

대표적으로 다음과 같은 source가 존재합니다.

- Item
- Application
- Action
- Recent
- Suggested

검색어가 없는 경우에는 Recent를 우선 사용하고, Recent가 없는
초기 상태에서는 Suggested를 통해 접근 가능한 기본 대상을 제시할 수
있습니다.

검색어가 입력되면 검색 가능한 target을 수집하고 결과를 표시합니다.

Universal Search 자체가 각 Item의 구체적인 실행 방법을 독립적으로
구현하지는 않습니다.

선택된 결과는 해당 result type에 맞는 shared execution path 또는
system action으로 전달됩니다.

## Application System

Application은 중앙 Application Registry를 통해 등록합니다.

Registry는 Application의 identity와 실행에 필요한 metadata 및
component를 시스템에 제공합니다.

Application은 내부 구현 및 capability 단위이지만 모든 Application이
사용자에게 직접 launchable entry로 노출될 필요는 없습니다.

예를 들어 어떤 Application은 사용자가 직접 실행할 수 있고,
다른 Application은 특정 Item을 처리할 때만 내부적으로 사용될 수
있습니다.

따라서 다음 관계를 전제로 하지 않습니다.

```text
Application
=
Launcher Entry
=
Window Owner
=
Tab Identity
```

이 역할들은 필요한 경우 일치할 수 있지만 architecture 수준에서는
서로 독립적으로 취급합니다.

### Application Attachment

Echo OS에는 기존 Application Window를 지원하기 위한 Application
attachment 구조가 존재합니다.

Window는 Application 없이 생성된 뒤 필요한 Application을 연결할 수
있으며, Application 실행에 필요한 initial context를 전달할 수
있습니다.

이 구조는 Surface Tab 기반 interaction과 별개로 기존 Window/Application
execution path를 지원합니다.

Surface가 모든 Application Window를 대체하는 것으로 가정하지 않습니다.

## Item Model

Item은 system에서 실행하거나 작업 대상으로 사용할 수 있는 대상을
표현합니다.

현재 주요 Item은 VFS의 File과 Directory입니다.

Item의 identity는 현재 VFS path를 중심으로 판단합니다.

Item은 특정 Application에 의해 소유되지 않습니다.

Application은 Item을 표시하거나 편집하기 위한 implementation을
제공할 수 있지만 Item 자체는 VFS와 system-level execution model에
속합니다.

현재 Stable Item ID와 같은 별도의 generalized identity system은
도입하지 않았습니다.

## Item Execution

Item execution policy는 개별 UI component에 분산하지 않고 공통
system-level path를 통해 처리합니다.

Surface, Files, Recent 등 서로 다른 진입점에서 Item을 실행하더라도
file type과 handler에 대한 knowledge를 각각 복제하지 않습니다.

개념적으로 다음과 같습니다.

```text
Interaction Context
→ Item
→ Shared Item Execution
→ Appropriate Target / Capability
```

현재 대표적인 execution mapping은 다음과 같습니다.

```text
Directory
→ Files

Text File
→ Text Editor

Unsupported Item
→ no supported execution
```

이 mapping은 현재 prototype에 필요한 범위로 유지합니다.

일반화된 MIME system, Handler Registry, Open With 또는 generic
Capability framework는 현재 구현하지 않습니다.

### Context-Specific Execution

공통 Item execution policy가 존재하더라도 모든 interaction이 동일한
navigation 결과를 가져야 하는 것은 아닙니다.

예를 들어 Directory는 context에 따라 다르게 처리할 수 있습니다.

```text
Universal Search / Surface
→ Directory
→ Files target for that directory

Files
→ Directory
→ navigate current Files target
```

공통 execution policy는 Item을 어떻게 처리할 수 있는지를 공유하기
위한 것이며, 사용자가 어느 context에서 어디로 이동해야 하는지까지
강제로 통일하기 위한 것은 아닙니다.

## Virtual File System

Echo OS는 사용자의 실제 File System에 의존하지 않고 브라우저 내부의
Virtual File System을 사용합니다.

현재 VFS는 다음과 같은 기본 개념을 표현합니다.

- File
- Directory
- Path
- File content

VFS는 Files UI와 독립된 system-level data model입니다.

현재 filesystem state는 관련 consumer 사이에서 공유됩니다.

따라서 Files에서 생성, 수정, 이름 변경 또는 삭제한 Item은 같은 VFS를
사용하는 다른 Surface나 Application에서도 동일한 filesystem state를
기준으로 관찰할 수 있습니다.

```text
Shared VFS
├─ Files
├─ Surface Items
├─ Text Editor
└─ Discovery / Recent resolution
```

VFS mutation은 기존 state를 직접 수정하기보다 React state update와
호환되는 방식으로 새로운 filesystem state를 생성합니다.

현재 VFS는 prototype을 위한 in-memory filesystem이며 실제 local
filesystem이나 persistent storage와 연결되어 있지 않습니다.

### VFS Operations

현재 VFS는 prototype에서 필요한 기본적인 filesystem operation을
지원합니다.

대표적으로 다음과 같습니다.

- Directory creation
- Text File creation
- Rename
- Delete
- Text content update
- Directory traversal
- Item lookup

이 operation들은 Files UI 자체의 기능으로 구현하기보다 VFS operation을
통해 수행합니다.

이를 통해 동일한 filesystem state를 사용하는 다른 consumer와
일관성을 유지합니다.

### Deleted or Missing Items

열려 있는 Item이 VFS에서 삭제될 수 있으므로 open Tab과 VFS entry의
존재를 동일한 것으로 가정하지 않습니다.

이미 열린 Tab이 참조하는 Item이 더 이상 존재하지 않는 경우 UI는
crash하지 않고 missing target을 안전하게 처리해야 합니다.

삭제 시 관련 selection이나 discovery state는 가능한 범위에서
정리하지만, 이미 열린 Tab을 강제로 닫는 것을 VFS mutation의
기본 동작으로 사용하지 않습니다.

## Files

Files는 VFS를 탐색하고 조작하기 위한 Application / work target입니다.

Files의 주요 responsibility는 다음과 같습니다.

- Directory contents 표시
- Current directory 관리
- Directory navigation
- Selection
- File system operation invocation
- File Item execution 요청

Files는 자신의 navigation context를 관리합니다.

대표적인 navigation state는 다음과 같습니다.

```text
Current Directory
Back History
Forward History
Selection
```

지원되는 navigation에는 다음이 포함됩니다.

- Enter Directory
- Up
- Back
- Forward

Directory를 Files 내부에서 실행하면 현재 Files context 안에서
navigation합니다.

File을 실행하는 경우 Files가 해당 File type의 Application을 직접
결정하지 않고 shared Item execution path로 전달합니다.

### Files Operations

Files는 현재 VFS operation을 사용자에게 노출하는 기본적인 filesystem
interaction을 제공합니다.

현재 주요 operation은 다음과 같습니다.

- New Folder
- New File
- Rename
- Delete

New File은 현재 지원되는 File type을 생성하기 위한 확장 가능한
submenu 형태로 제공될 수 있습니다.

생성 직후 Rename과 같이 서로 연결되는 interaction은 Files가 현재
selection과 editing state를 통해 관리합니다.

VFS는 실제 filesystem mutation을 담당하고 Files는 해당 mutation을
호출하는 interaction layer 역할을 합니다.

## Text Editor

Text Editor는 현재 text File을 표시하고 수정하기 위한 Application
implementation입니다.

Text Editor는 VFS의 File content를 사용하며 저장 시 shared VFS의
content를 갱신합니다.

Text editing state와 persisted VFS content를 구분합니다.

개념적으로 다음과 같습니다.

```text
VFS File Content
→ Editor Buffer
→ User Edit
→ Dirty State
→ Save
→ VFS File Content
```

Editor는 수정 여부를 나타내는 dirty state를 관리합니다.

저장되지 않은 변경은 VFS content와 동일한 것으로 취급하지 않습니다.

Save action이 실행되면 현재 editor buffer를 shared VFS에 반영하고
dirty state를 갱신합니다.

현재 persistence는 VFS lifetime에 한정되므로 browser reload 이후까지
실제 File content를 보존하는 persistent storage system은 아닙니다.

## Recent Items

Recent는 사용자가 최근 작업한 Item으로 다시 접근하기 위한 discovery
state입니다.

현재 Recent는 Item-centric하게 관리합니다.

Recent는 Application history, Window history, Files navigation history와
동일한 개념이 아닙니다.

Item이 적절한 execution path를 통해 사용되면 해당 Item identity를
기준으로 Recent를 갱신할 수 있습니다.

동일한 Item은 중복된 별도 Recent entry로 계속 추가하기보다 기존
entry를 최근 위치로 갱신하는 방식으로 다룹니다.

Recent에서 Item을 선택해도 별도의 execution architecture를 사용하지
않고 일반적인 Item execution path로 다시 전달합니다.

```text
Recent
→ Item
→ Shared Item Execution
→ Current Context
```

Recent는 현재 in-memory prototype state입니다.

Browser reload 이후까지 유지되는 persistent Recent storage는 아직
구현하지 않았습니다.

### Recent and VFS Changes

Recent가 VFS Item을 참조하므로 filesystem mutation과의 관계를
고려합니다.

Item이 삭제되어 더 이상 유효하지 않은 경우 stale Recent entry가
실행 가능한 Item처럼 남지 않도록 정리합니다.

Rename과 같이 Item identity에 영향을 주는 operation 역시 현재
path-based identity model과 일관되게 처리해야 합니다.

## Taskbar

Taskbar는 현재 실행 중인 Window의 상태를 표시하고 Window-level
interaction을 제공합니다.

주요 역할은 다음과 같습니다.

- Running Window 표시
- Active Window 표현
- Minimized Window 접근
- Window restore / focus interaction

Taskbar를 고정 Application launcher 중심의 구조로 사용하지 않습니다.

Application Registry와 Taskbar의 사용자-facing representation은
동일하지 않습니다.

Surface 역시 Window System 위에서 동작하므로 Taskbar의 Window-level
management 대상이 될 수 있습니다.

## State Ownership

Echo OS는 별도의 전역 state-management framework 없이 React state와
component/system ownership을 중심으로 상태를 관리합니다.

State는 가능한 한 실제 responsibility를 가진 layer에 둡니다.

현재 주요 ownership은 개념적으로 다음과 같습니다.

```text
Window Manager
→ Window lifecycle
→ Position / Size
→ Focus / Z-order
→ Minimize / Maximize

Surface
→ Tabs
→ Active Tab
→ Surface-local work context

Tab / Target
→ Target-specific navigation or editing state

Shared VFS
→ Filesystem structure
→ File content

Files
→ Current directory
→ Navigation history
→ Selection
→ Files-local interaction state

Text Editor
→ Editor buffer
→ Dirty state

Desktop / System Layer
→ Cross-system coordination
→ Recent
→ Shared execution paths
```

실제 공유가 필요한 state는 shared owner로 올리되, 단순한 접근 편의를
위해 모든 state를 global로 만들지는 않습니다.

여러 component가 같은 데이터를 독립적으로 복제하고 수동으로
synchronize하는 구조보다 하나의 coherent source of truth를
우선합니다.

## Current Data Flows

### Create Surface

```text
Desktop
→ Create Surface Window
→ Initialize Surface
→ Create Blank Tab
→ Universal Search
```

Blank Tab은 아직 특정 work target에 연결되지 않은 초기 상태입니다.

### Item from Universal Search

```text
Blank Tab
→ Universal Search
→ Item Result
→ Shared Item Execution
→ Resolve Target
→ Current Surface Tab
→ Recent Update
```

동일한 Surface에 matching Item Tab이 이미 존재하는 경우 새 Tab을
중복 생성하기보다 기존 Tab을 활성화할 수 있습니다.

### File from Files

```text
Files
→ File interaction
→ Shared Item Execution
→ Text File
→ Text Editor Target
→ Recent Update
```

Files는 Text File이 어떤 Application implementation을 사용하는지에
대한 execution policy를 직접 소유하지 않습니다.

### Directory inside Files

```text
Files
→ Directory
→ Files navigation
→ Update current directory
→ Update navigation history
```

이 경우 새로운 Item execution context를 만드는 대신 현재 Files
target 안에서 navigation합니다.

### Directory from Universal Search

```text
Universal Search
→ Directory Item
→ Shared Item Execution
→ Files Target
→ Open requested directory
```

Surface에서 Directory를 실행하는 것과 Files 내부에서 Directory를
탐색하는 것은 동일한 VFS Item을 사용하지만 navigation context는
다릅니다.

### Text Editing

```text
Text File
→ Text Editor
→ Editor Buffer
→ Edit
→ Dirty
→ Save
→ Shared VFS Update
→ Clean
```

다른 VFS consumer는 저장된 shared VFS state를 기준으로 File content를
관찰합니다.

### File System Mutation

```text
Files Interaction
→ VFS Operation
→ Shared VFS Update
→ Consumers render updated state
```

Rename이나 Delete처럼 Item identity 또는 존재 여부에 영향을 주는
operation은 selection, Recent, open target resolution 등 관련 state와의
일관성을 고려합니다.

## Keyboard and Interaction Routing

Keyboard interaction은 active work context와 실제 focused element를
구분해서 처리합니다.

Window, Surface 또는 Tab이 active하다는 이유만으로 그 내부의 editable
element가 사용할 keyboard input을 상위 layer가 가로채지 않습니다.

예를 들어 Text Editor에서는 textarea가 focused된 경우 Backspace가
일반 text deletion으로 동작합니다.

반면 editor input 밖에서 해당 Tab context가 keyboard action을
소유하는 경우에는 Tab navigation과 같은 context-level behavior가
동작할 수 있습니다.

동일한 원칙은 Files의 Rename input과 기타 editable control에도
적용합니다.

Keyboard shortcut, Context Menu, Toolbar 등 서로 다른 invocation
method가 동일한 user action을 표현한다면 가능한 경우 같은 underlying
operation을 호출합니다.

## Persistence

현재 Echo OS의 주요 runtime state는 browser memory에 존재합니다.

현재 다음과 같은 상태는 page reload를 넘어 영구적으로 보존되는
persistent system으로 취급하지 않습니다.

- Surface state
- Tab state
- Recent
- VFS content
- Window layout
- Application runtime state

따라서 현재 architecture에서 persistence는 별도의 완성된 subsystem이
아닙니다.

향후 persistence가 실제 prototype requirement가 되면 어떤 state를
어떤 lifetime으로 저장할지 먼저 정의한 뒤 storage mechanism을
선택합니다.

## Current Boundaries

현재 architecture는 prototype에 필요한 범위까지만 일반화합니다.

현재 별도의 완성된 subsystem으로 구현하지 않은 영역에는 다음과 같은
것들이 있습니다.

- MIME-based generalized file handling
- Handler Registry
- Open With
- General Capability framework
- Stable Item ID system
- Persistent VFS
- Recent persistence
- Surface / Tab persistence
- Generic Workspace layer
- Real filesystem integration
- Process model
- Real OS-level isolation

이 기능들은 미래에 필요할 가능성이 있다는 이유만으로 architecture에
미리 추가하지 않습니다.

실제 prototype interaction에서 구체적인 필요가 확인되면 현재 구조를
확장합니다.

## Architecture Maintenance

이 문서는 현재 architecture를 설명하므로 meaningful structural change가
생기면 함께 갱신합니다.

예를 들어 다음과 같은 변화는 이 문서의 수정 대상이 될 수 있습니다.

- 새로운 major subsystem 추가
- State ownership 변경
- Surface / Tab lifecycle 구조 변경
- Item execution responsibility 변경
- VFS ownership 또는 persistence model 변경
- Application과 Window의 관계 변경
- Cross-Surface interaction architecture 추가
- 새로운 persistent state system 도입

반대로 다음과 같은 작은 implementation detail은 일반적으로 이 문서에
기록하지 않습니다.

- 특정 CSS selector
- 정확한 pixel 값
- 작은 visual adjustment
- Context Menu의 단일 항목 추가
- 특정 shortcut 하나의 추가
- 일시적인 metadata field
- 작은 component-local state
- 특정 list의 최대 표시 개수

Architecture 문서의 목적은 코드 전체를 문장으로 복제하는 것이 아니라,
현재 시스템의 주요 구조와 responsibility를 이해할 수 있게 하는
것입니다.

## Architectural Principle

Echo OS의 architecture는 사용자-facing concept와 interaction을
지원하기 위한 내부 구현 구조입니다.

내부에 Window Manager, Application Registry, VFS, Surface state와 같은
시스템이 존재한다고 해서 사용자가 반드시 같은 구조를 직접 조작해야
하는 것은 아닙니다.

```text
Internal System Structure
≠
User-facing Interaction Structure
```

공통 responsibility가 실제로 여러 곳에서 반복되면 적절한 shared
abstraction을 만들 수 있습니다.

반대로 미래에 필요할 가능성만으로 generalized framework를 먼저
구축하지 않습니다.

Architecture는 현재 prototype의 실제 요구사항을 지원할 만큼만
구체화하고, Interaction을 통해 새로운 필요가 확인될 때 발전시킵니다.
