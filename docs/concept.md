# Concept

## Overview

Echo OS는 웹 브라우저에서 실행되는 Concept OS이자 인터랙티브 프로토타입입니다.

실제 운영체제의 커널이나 하드웨어 계층을 구현하는 것이 아니라,
운영체제가 사용자에게 제공하는 작업 환경과 상호작용 방식을 새로운
관점에서 탐구하는 것을 목표로 합니다.

Echo OS는 기존 데스크톱 운영체제를 그대로 재현하거나 외형만 다르게
만드는 것을 목표로 하지 않습니다.

대신 기존 운영체제에서 당연하게 여겨지는 구조와 상호작용을 다시
살펴보고, 다른 방식의 사용자 경험이 가능한지를 실제로 동작하는
프로토타입을 통해 탐색합니다.

## Core Question

Echo OS의 중심에는 다음 질문이 있습니다.

> Application 중심 OS라는 기존의 전제를 내려놓고,
> 사용자의 작업을 중심으로 운영체제 환경을 다시 설계한다면?

기존 데스크톱 환경에서는 Application이 작업의 주요 진입점이 되는
경우가 많습니다.

사용자는 무엇인가를 하기 위해 적절한 Application을 찾고,
Application을 실행하고, Window를 열고, 그 안에서 필요한 File이나
Content를 다시 찾아 작업을 시작합니다.

이를 단순화하면 다음과 같습니다.

```text
Intent
→ Application
→ Window
→ File / Content
→ Work
```

Echo OS는 이 구조가 반드시 사용자 경험의 중심이어야 하는지
질문합니다.

Application, Window, File과 같은 기존 개념 자체를 부정하는 것이
아니라, 이들이 사용자 작업을 조직하는 유일한 방식이어야 하는지를
탐구합니다.

## Goal

Echo OS의 지향점은 다음과 같습니다.

> 운영체제를 사용하는 것보다,
> 운영체제로 하려던 일에 집중하게 한다.

이를 위해 Application 자체보다 사용자가 실제로 다루려는 대상과
작업 맥락을 사용자 경험의 앞쪽에 두는 방식을 탐구합니다.

개념적으로는 다음과 같은 방향을 지향합니다.

```text
Intent
→ Work Context
→ Work Target
→ Capability
→ Work
```

현재 Echo OS에서는 이러한 역할을 Surface, Item, Application 등의
개념을 통해 탐구하고 있습니다.

이 흐름은 고정된 최종 아키텍처나 Interaction specification이 아니라
Echo OS가 탐구하는 방향을 표현하기 위한 개념적 모델입니다.

Application을 제거하는 것이 목표는 아닙니다.

Application은 여전히 특정 대상을 표시하거나 조작하고 작업을 수행하기
위한 기능과 구현을 제공할 수 있습니다.

다만 Application이 반드시 사용자가 가장 먼저 선택해야 하는 대상이거나,
Window와 작업을 조직하는 최상위 단위일 필요는 없다고 봅니다.

## Design Philosophy

### Work First

사용자가 시스템 자체를 조작하는 과정보다 실제로 하려는 작업과 그
대상에 더 직접적으로 접근할 수 있어야 합니다.

기능을 설계할 때 기존 운영체제와 얼마나 비슷한지를 우선하기보다,
사용자가 자신의 목적에 도달하는 데 어떤 구조가 필요한지를 우선합니다.

시스템을 조작하는 과정은 사용자의 목적이 아니라 목적에 도달하기 위한
수단입니다.

### Application as Capability

Application은 제거해야 할 대상이 아니라 작업을 수행하기 위한 기능을
제공하는 수단으로 봅니다.

Application은 내부적으로 존재하더라도 항상 사용자에게 직접적인 실행
대상이나 작업의 최상위 단위로 노출될 필요는 없습니다.

사용자가 다루려는 대상에 필요한 Application이나 Capability를 시스템이
작업 흐름 안에서 연결할 수 있습니다.

반대로 Application 자체를 사용하는 것이 사용자의 목적이라면
Application을 직접적인 대상으로 다루는 것도 자연스럽습니다.

Echo OS는 Application을 숨기는 것을 목표로 하지 않습니다.

Application을 사용자가 의식해야 할 이유가 없는 상황에서 불필요한
중간 단계로 만들지 않는 것이 목적입니다.

### Item Independence

Item은 사용자가 작업하거나 행동할 수 있는 대상을 표현합니다.

Item은 특정 Application에 종속된 대상으로 보지 않습니다.

Application은 Item을 열거나 표시하고 조작할 수 있지만, Item 자체의
의미가 Application에 의해 결정될 필요는 없습니다.

현재 프로토타입에서 File과 Directory가 대표적인 Item이 될 수 있지만,
Item이라는 개념을 전통적인 File에만 한정하지 않습니다.

어떤 대상이 Item으로 표현되어야 하는지는 실제 Interaction의 필요에
따라 발전할 수 있습니다.

### Work Context

모든 작업이 Application 단위로 분리되어야 한다고 가정하지 않습니다.

서로 관련된 작업 대상은 사용자가 이해할 수 있는 하나의 작업 맥락
안에서 연결될 수 있습니다.

현재 Echo OS에서는 Surface가 이러한 Work Context의 역할을 탐구합니다.

Surface는 특정 Application의 소유 공간으로 정의되지 않습니다.

하나의 Surface 안에는 서로 다른 Application이나 Capability를 통해
다루어지는 여러 작업 대상이 존재할 수 있습니다.

Surface의 구체적인 구조와 Interaction은 프로토타입을 통해 계속
발전할 수 있지만, 그 목적은 Application의 경계를 그대로 재현하는
것이 아니라 사용자의 작업 맥락을 표현하는 것입니다.

### Work Target

사용자가 현재 무엇을 다루고 있는지는 그것을 구현하는 Application보다
중요한 사용자-facing identity가 될 수 있습니다.

현재 Echo OS에서는 Item과 Surface 안의 작업 대상 등이 이러한 역할을
할 수 있습니다.

예를 들어 어떤 Item을 편집하고 있다면 사용자가 작업 대상으로 인식해야
할 것은 편집기 자체보다 해당 Item일 수 있습니다.

이는 Application identity를 항상 숨겨야 한다는 의미가 아닙니다.

사용자에게 의미 있는 identity가 무엇인지는 현재 작업과 Context를
기준으로 판단합니다.

### Context Boundaries

작업 맥락은 단순한 시각적 그룹이 아니라 사용자가 작업을 조직하는
경계가 될 수 있습니다.

같은 대상이 여러 작업 맥락에서 사용될 수 있으며, 시스템이 동일한
대상이라는 이유만으로 서로 다른 Context를 자동으로 하나로 합칠
필요는 없습니다.

Context 사이의 이동이나 결합은 사용자의 작업 조직에 영향을 미치므로
명시적인 Interaction으로 다루는 방향을 우선합니다.

구체적인 재사용, 이동, 분리 방식은 Interaction 실험을 통해 발전시킵니다.

### System Structure ≠ User Structure

운영체제 내부의 구현 구조와 사용자가 경험하는 구조가 반드시 동일할
필요는 없습니다.

Application Registry, Window Manager, Virtual File System과 같은 내부
시스템은 구현을 위해 존재할 수 있습니다.

그러나 내부에 존재한다는 이유만으로 그 구조를 그대로 사용자
인터페이스에 노출하지 않습니다.

```text
Internal System Structure
≠
User-facing Interaction Structure
```

Architecture는 사용자 경험을 구현하기 위한 수단이며, 사용자 경험이
Architecture의 형태를 그대로 따라야 하는 것은 아닙니다.

### Familiarity with Purpose

기존 데스크톱 운영체제의 익숙한 상호작용을 무조건 제거하거나 다르게
만드는 것을 목표로 하지 않습니다.

Window 이동, 크기 조절, File 탐색처럼 이미 효과적이고 널리 이해되는
상호작용은 필요에 따라 유지합니다.

기존 방식을 변경하는 것은 Echo OS의 핵심 목표에 실질적인 의미가 있을
때에 한합니다.

새로운 방식이라는 사실 자체는 새로운 Interaction을 도입할 이유가
되지 않습니다.

### Prototype First

Echo OS의 개념은 처음부터 완성된 이론으로 정의하지 않습니다.

아이디어를 먼저 작은 형태로 구현하고, 실제로 사용해 본 뒤, 그 과정에서
발견한 문제와 가능성을 바탕으로 구조를 발전시킵니다.

```text
Idea
→ Prototype
→ Use
→ Observe
→ Refine
```

Surface, Item, Application, Tab, Workspace, Action, Capability 등의
개념도 현재 정의를 최종적인 것으로 간주하지 않습니다.

새로운 개념은 실제 Interaction에서 필요성이 확인되었을 때 도입하거나
구체화합니다.

이미 도입된 개념 역시 실제 사용을 통해 역할이 달라지거나 더 적절한
구조가 발견되면 변경할 수 있습니다.

Echo OS의 Concept은 프로토타입보다 먼저 완성되는 명세가 아니라,
프로토타입과 함께 발전하는 모델입니다.

## Conceptual Relationships

Echo OS는 현재 다음과 같은 역할의 분리를 탐구합니다.

```text
Intent
→ Work Context
→ Work Target
→ Capability
→ Work
```

현재 사용되는 개념으로 표현하면 대략 다음과 대응할 수 있습니다.

```text
Work Context
→ Surface

Work Target
→ Item or another target represented within a Surface

Capability
→ Application or another implementation capable of handling the target
```

이 대응 관계는 영구적인 type hierarchy나 Architecture contract를
정의하기 위한 것이 아닙니다.

특히 다음 관계를 보편적인 전제로 두지 않습니다.

```text
Application = Launcher Entry
Application = Window Owner
Application = Tab Identity
Application = Item Owner
```

특정 상황에서는 이들이 일치할 수 있습니다.

Echo OS가 탐구하는 것은 이 관계들이 반드시 항상 일치해야 하는가라는
질문입니다.

## Scope

Echo OS는 실제 운영체제가 아니라 운영체제의 사용자 경험을 탐구하기
위한 Concept OS입니다.

주요 탐구 대상은 다음과 같습니다.

- 사용자의 작업과 Intent
- Work Context
- Work Target
- Item
- Application과 Capability
- Surface와 공간적 작업 환경
- 작업 중심 Interaction
- 내부 시스템 구조와 사용자-facing 구조의 분리

구체적인 UI, Application, 시스템 구성 요소는 프로토타입이 발전하면서
추가되거나 변경될 수 있습니다.

다음과 같은 실제 운영체제의 저수준 기능을 구현하는 것은 프로젝트의
목표가 아닙니다.

- Kernel
- Hardware Access
- Device Drivers
- Real Process Isolation
- Real Security Boundaries
- Real Operating System APIs

필요한 경우 이러한 개념을 프로토타입 안에서 표현하거나 모사할 수
있지만, 기술적인 운영체제 구현 자체가 프로젝트의 목적은 아닙니다.

## Exploratory Nature

Echo OS는 특정한 사용자 인터페이스가 기존 운영체제보다 우월하다는
것을 증명하려는 프로젝트가 아닙니다.

Application 중심의 데스크톱 모델에는 오랜 시간 발전해 온 이유와
장점이 있습니다.

Echo OS는 그 모델을 부정하기보다, 그것을 절대적인 전제로 두지 않았을
때 어떤 다른 작업 환경이 가능해지는지를 탐구합니다.

따라서 현재 사용되는 Surface, Item, Application, Window, Tab 등의
구조 역시 최종적인 정답으로 간주하지 않습니다.

프로토타입을 실제로 사용하면서 불필요하거나 불편한 구조는 변경할 수
있으며, 기존 데스크톱 방식이 더 적절한 부분은 그대로 유지할 수
있습니다.

프로젝트의 성공은 기존 운영체제와 얼마나 다르게 보이는지가 아니라,
실제로 구현하고 사용해 봄으로써 이러한 질문에 의미 있는 답을
탐색했는지에 달려 있습니다.

## AI Collaboration

인공지능을 프로젝트의 주요 제작 도구로 사용합니다.

인공지능은 다음과 같은 작업에 활용할 수 있습니다.

- 아이디어 탐색
- UI/UX 탐색
- 코드 생성
- 코드 분석
- 디버깅
- 그래픽 및 아이콘 제작
- 반복적인 구현 작업

인공지능은 프로젝트의 방향을 스스로 결정하는 주체가 아니라 제작
과정에서 활용하는 도구입니다.

최종적인 작품의 방향, 개념, 기능, UX, 디자인, 아키텍처 및 구현 결과에
대한 판단은 제작자가 담당합니다.
