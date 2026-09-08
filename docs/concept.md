# Concept

## Overview

Echo OS는 웹 브라우저에서 실행되는 Concept OS이자 인터랙티브 프로토타입입니다.

실제 운영체제의 커널이나 하드웨어 계층을 구현하는 것이 아니라, 운영체제가 사용자에게 제공하는 작업 환경과 상호작용 방식을 새로운 관점에서 탐구하는 것을 목표로 합니다.

Echo OS는 기존 데스크톱 운영체제를 그대로 재현하거나 외형만 다르게 만드는 것을 목표로 하지 않습니다.

대신 기존 운영체제에서 당연하게 여겨지는 구조와 상호작용을 다시 살펴보고, 다른 방식의 사용자 경험이 가능한지를 실제로 동작하는 프로토타입을 통해 탐색합니다.

## Core Question

Echo OS의 중심에는 다음 질문이 있습니다.

> Application 중심 OS라는 기존의 전제를 내려놓고, 사용자의 작업을 중심으로 운영체제 환경을 다시 설계한다면?

기존 데스크톱 환경에서는 Application이 작업의 주요 진입점이 되는 경우가 많습니다.

사용자는 무엇인가를 하기 위해 적절한 Application을 찾고, Application을 실행하고, Window를 열고, 그 안에서 필요한 File이나 Content를 다시 찾아 작업을 시작합니다.

이를 단순화하면 다음과 같습니다.

Intent
→ Application
→ Window
→ File / Content
→ Work

Echo OS는 이 구조가 반드시 사용자 경험의 중심이어야 하는지 질문합니다.

## Goal

Echo OS의 지향점은 다음과 같습니다.

> 운영체제를 사용하는 것보다,
> 운영체제로 하려던 일에 집중하게 한다.

이를 위해 Application 자체보다 사용자가 실제로 다루려는 대상과 작업 맥락을 사용자 경험의 앞쪽에 두는 방식을 탐구합니다.

현재 프로토타입에서는 이를 다음과 같은 흐름으로 실험하고 있습니다.

Intent
→ Surface
→ Item
→ Application / Capability
→ Work

Application을 제거하는 것이 목표는 아닙니다.

Application은 여전히 특정 Item을 표시하거나 조작하기 위한 기능과 구현을 제공할 수 있습니다.

다만 Application이 반드시 사용자가 가장 먼저 선택해야 하는 대상이거나, Window와 작업을 조직하는 최상위 단위일 필요는 없다고 봅니다.

## Design Philosophy

### Work First

사용자가 시스템 자체를 조작하는 과정보다 실제로 하려는 작업과 그 대상에 더 직접적으로 접근할 수 있어야 합니다.

기능을 설계할 때 기존 운영체제와 얼마나 비슷한지를 우선하기보다, 사용자가 자신의 목적에 도달하는 데 어떤 구조가 필요한지를 우선합니다.

### Application as Capability

Application은 제거해야 할 대상이 아니라 작업을 수행하기 위한 기능을 제공하는 수단으로 봅니다.

Application은 내부적으로 존재하더라도 항상 사용자에게 직접적인 실행 대상으로 노출될 필요는 없습니다.

하나의 Item에 필요한 Application이나 Capability를 시스템이 작업 흐름 안에서 연결할 수 있습니다.

### Item Independence

Item은 특정 Application에 종속된 대상으로 보지 않습니다.

Application은 Item을 열거나 표시하고 조작할 수 있지만, Item 자체의 의미가 Application에 의해 결정될 필요는 없습니다.

현재 프로토타입에서는 File과 Directory가 주요 Item이지만, Item이라는 개념을 전통적인 File에만 한정하지 않습니다.

### System Structure ≠ User Structure

운영체제 내부의 구현 구조와 사용자가 경험하는 구조가 반드시 동일할 필요는 없습니다.

Application Registry, Window Manager, Virtual File System과 같은 내부 시스템은 구현을 위해 존재할 수 있습니다.

그러나 내부에 존재한다는 이유만으로 그 구조를 그대로 사용자 인터페이스에 노출하지 않습니다.

### Familiarity with Purpose

기존 데스크톱 운영체제의 익숙한 상호작용을 무조건 제거하거나 다르게 만드는 것을 목표로 하지 않습니다.

Window 이동, 크기 조절, File 탐색처럼 이미 효과적인 상호작용은 필요에 따라 유지합니다.

기존 방식을 변경하는 것은 Echo OS의 핵심 목표에 실질적인 의미가 있을 때에 한합니다.

### Prototype First

Echo OS의 개념은 처음부터 완성된 이론으로 정의하지 않습니다.

아이디어를 먼저 작은 형태로 구현하고, 실제로 사용해 본 뒤, 그 과정에서 발견한 문제와 가능성을 바탕으로 구조를 발전시킵니다.

Idea
→ Prototype
→ Use
→ Observe
→ Refine

Workspace, Tab, Action, Capability 등의 개념도 필요성이 실제 상호작용에서 확인되기 전에 완전한 시스템으로 미리 정의하지 않습니다.

## Current Interaction Direction

현재 Echo OS는 Universal Surface를 주요한 작업 진입 인터페이스로 실험하고 있습니다.

Surface는 단순한 Application Launcher가 아닙니다.

사용자는 하나의 Surface에서 다음과 같은 대상을 발견할 수 있습니다.

- Item
- Application
- Action
- Recent Item

Item을 선택하면 필요한 Application 또는 Capability가 연결되어 해당 Item을 작업할 수 있는 환경이 만들어집니다.

예를 들어 Text Item을 선택했을 때 사용자가 먼저 Text Viewer를 실행할 필요는 없습니다.

Text Viewer는 시스템 내부에 Application으로 존재하지만, Item을 통해 필요할 때 연결될 수 있습니다.

이러한 구조를 통해 다음과 같은 흐름을 탐구합니다.

Surface
→ Item
→ Application / Capability
→ Window
→ Recent
→ Item

## Scope

Echo OS는 실제 운영체제가 아니라 운영체제의 사용자 경험을 탐구하기 위한 Concept OS입니다.

현재 주요 탐구 대상은 다음과 같습니다.

- Desktop
- Universal Surface
- Item
- Application
- Window System
- Virtual File System
- Recent Items
- 작업 중심 Interaction

다음과 같은 실제 운영체제의 저수준 기능을 구현하는 것은 프로젝트의 목표가 아닙니다.

- Kernel
- Hardware Access
- Device Drivers
- Real Process Isolation
- Real Security Boundaries
- Real Operating System APIs

필요한 경우 이러한 개념을 프로토타입 안에서 표현할 수 있지만, 기술적인 운영체제 구현 자체가 프로젝트의 목적은 아닙니다.

## Exploratory Nature

Echo OS는 특정한 사용자 인터페이스가 기존 운영체제보다 우월하다는 것을 증명하려는 프로젝트가 아닙니다.

Application 중심의 데스크톱 모델에는 오랜 시간 발전해 온 이유와 장점이 있습니다.

Echo OS는 그 모델을 부정하기보다, 그것을 절대적인 전제로 두지 않았을 때 어떤 다른 작업 환경이 가능해지는지를 탐구합니다.

따라서 현재의 Surface, Item, Window 등의 구조 역시 최종적인 정답으로 간주하지 않습니다.

프로토타입을 실제로 사용하면서 불필요하거나 불편한 구조는 변경할 수 있으며, 기존 데스크톱 방식이 더 적절한 부분은 그대로 유지할 수 있습니다.

## AI Collaboration

인공지능을 프로젝트의 주요 제작 도구로 사용합니다.

인공지능은 다음과 같은 작업에 활용할 수 있습니다.

- 아이디어 탐색
- UI/UX 탐색
- 코드 생성
- 코드 분석
- 디버깅
- 그래픽 및 아이콘 제작
- 반복적인 구현 및 검증 작업

인공지능은 프로젝트의 방향을 스스로 결정하는 주체가 아니라 제작 과정에서 활용하는 도구입니다.

최종적인 작품의 방향, 개념, 기능, UX, 디자인, 아키텍처 및 구현 결과에 대한 판단은 제작자가 담당합니다.
