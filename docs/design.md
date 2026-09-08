# Design

## Overview

Echo OS의 디자인은 단순히 하나의 일관된 데스크톱 인터페이스를 만드는 것을 넘어, 사용자가 시스템 자체보다 자신의 작업과 그 대상에 집중할 수 있도록 하는 것을 목표로 합니다.

시각적 디자인과 Interaction은 다음 질문을 기준으로 판단합니다.

> 이 인터페이스가 사용자가 하려는 작업에 더 직접적으로 접근하도록 돕는가?

기존 운영체제의 익숙한 방식을 무조건 따르거나 거부하지 않습니다.

사용자에게 유용한 관습은 유지하고, Application이나 시스템 구조를 불필요하게 의식하게 만드는 부분은 다른 방식으로 설계할 수 있습니다.

## Interaction Principles

### Work First

사용자의 작업을 시스템 구조보다 우선합니다.

사용자가 무엇을 하기 위해 먼저 어떤 Application을 실행해야 하는지 항상 판단하도록 요구하지 않습니다.

가능한 경우 사용자가 실제로 다루려는 Item이나 작업 맥락에서 시작하고, 필요한 Application이나 Capability는 그 흐름 안에서 연결합니다.

```text
Work / Intent
→ Item
→ Capability
```

Application을 제거하는 것이 아니라, Application 선택 자체가 불필요한 단계가 되는 경우 이를 앞에 두지 않는 것이 목적입니다.

### Item First

사용자가 실제로 다루는 대상은 가능한 한 직접 접근할 수 있어야 합니다.

Item은 특정 Application의 하위 요소처럼 표현할 필요가 없습니다.

예를 들어 Text Item을 열기 위해 사용자가 먼저 Text Viewer를 찾아 실행할 필요가 없다면, Item을 직접 선택하고 필요한 기능을 연결하는 흐름을 우선합니다.

다만 모든 Interaction을 무조건 Item 중심으로 만들어야 한다는 의미는 아닙니다.

Application 자체가 사용자의 명확한 목적일 경우에는 Application을 직접 선택할 수 있습니다.

### Progressive Exposure

Application과 시스템 기능은 필요한 순간에 드러날 수 있습니다.

시스템 내부에 존재하는 모든 기능과 Application을 항상 사용자에게 직접적인 선택지로 노출하지 않습니다.

사용자가 현재 수행하려는 작업과 관련성이 낮은 시스템 구조는 가능한 한 뒤로 물립니다.

이를 통해 선택지를 무조건 줄이는 것이 아니라, 현재 맥락에서 의미 있는 선택지를 우선합니다.

### Avoid Duplicate Intent

내부적으로 서로 다른 구조라고 해서 사용자에게도 서로 다른 선택지로 보여줄 필요는 없습니다.

예를 들어 동일한 결과를 만드는

- `About · Application`
- `Open About · Action`

을 동시에 노출하는 것은 피합니다.

Item, Application, Action 등의 구분은 시스템에 필요할 수 있지만, 사용자가 동일한 의도를 여러 형태로 구별해야 하는 상황은 최소화합니다.

### Context over Uniformity

일관성은 중요하지만, 모든 상황에서 동일한 동작을 강제하는 것을 의미하지는 않습니다.

같은 Item이라도 사용자가 접근한 맥락에 따라 더 자연스러운 Interaction이 달라질 수 있습니다.

예를 들어:

```text
Surface → Directory
→ 해당 Directory를 Files에서 열기

Files → Directory double-click
→ 현재 Files Window 안에서 이동
```

두 동작은 내부적으로 완전히 동일하지 않지만, 각 Context에서는 자연스럽고 예측 가능한 동작입니다.

추상적인 구조적 일관성보다 사용자가 현재 하고 있는 작업의 연속성을 우선합니다.

### Familiarity with Purpose

기존 데스크톱 운영체제의 관습을 단순히 기존 방식이라는 이유로 제거하지 않습니다.

Window의:

- Move
- Resize
- Minimize
- Maximize
- Restore
- Close

와 같이 이미 널리 이해되는 Interaction은 Echo OS의 목표와 충돌하지 않는 한 유지할 수 있습니다.

새로운 Interaction은 기존 방식과 다르다는 사실 자체가 목적이 되어서는 안 됩니다.

기존 방식을 변경했을 때 사용자의 작업 흐름이 실제로 단순해지거나 더 직접적이 되는 경우에만 변경할 이유가 있습니다.

### Minimize System Mediation

사용자가 원하는 결과에 도달하기 위해 운영체제 자체를 조작해야 하는 단계를 가능한 한 줄입니다.

다음과 같은 과정이 항상 필요하다고 가정하지 않습니다.

```text
Find Application
→ Launch Application
→ Find Item
→ Start Work
```

필요한 경우 다음과 같이 더 직접적인 흐름을 사용할 수 있습니다.

```text
Find Item
→ Start Work
```

시스템은 필요한 Application이나 Capability를 연결하되, 그 과정 자체가 사용자의 주된 관심 대상이 되지 않도록 합니다.

## Surface

Universal Surface는 Echo OS의 주요 진입 Interaction 중 하나입니다.

Surface는 Application Launcher나 Start Menu를 그대로 대체하는 것이 아닙니다.

하나의 공통 interface에서 현재 맥락에 필요한 대상을 발견하고 작업으로 진입하기 위한 공간입니다.

Surface는 현재 다음과 같은 대상을 다룰 수 있습니다.

- Item
- Application
- Action
- Recent Item

빈 Surface에서는 최근 작업한 Item을 우선하여 사용자가 이전 작업으로 빠르게 돌아갈 수 있도록 합니다.

검색이 시작되면 Item, Application, Action을 하나의 검색 흐름 안에서 탐색할 수 있습니다.

결과의 기술적인 종류보다 사용자가 그 결과를 통해 무엇을 할 수 있는지가 더 중요합니다.

## Application

Application은 Echo OS에서 여전히 중요한 UI와 기능 단위입니다.

다만 모든 Application이 반드시:

- Launcher에 표시되고
- 사용자가 직접 실행하며
- 자신의 Window를 소유하는

형태일 필요는 없습니다.

사용자가 직접 실행하는 것이 의미 있는 Application은 Surface를 통해 접근할 수 있습니다.

특정 Item을 처리하기 위한 Application은 사용자가 직접 선택하지 않아도 필요한 순간에 연결될 수 있습니다.

Application의 존재를 숨기는 것 자체가 목적은 아닙니다.

사용자가 Application을 선택해야 할 이유가 없는 상황에서 불필요한 중간 단계로 만들지 않는 것이 목적입니다.

## Window

Window는 사용자가 작업을 배치하고 확인하는 공간입니다.

Window를 반드시 특정 Application의 시각적 소유물로 취급하지 않습니다.

Application은 Window 안에서 기능을 제공할 수 있지만, 사용자가 Window를 이해하기 위해 항상 Application identity를 먼저 알아야 할 필요는 없습니다.

Window의 제목과 내용은 가능한 경우 Application 자체보다 현재 작업이나 Item을 우선하여 표현할 수 있습니다.

예를 들어 Text Item을 연 Window에서는 `Text Viewer`보다 실제 Item의 이름이 더 중요한 정보일 수 있습니다.

## Visual Direction

Echo OS는 하나의 일관된 제품처럼 느껴지는 시각적 언어를 사용합니다.

개별 화면을 각각 독립적으로 디자인하지 않고 운영체제 전체에 공통된 시각적 원칙을 적용합니다.

시스템 chrome은 사용자의 Content와 Item보다 불필요하게 강한 시각적 우선순위를 가져서는 안 됩니다.

시각적인 독창성 자체보다 Interaction hierarchy와 작업 집중을 지원하는 것을 우선합니다.

## General UI Principles

### Consistency

동일한 의미와 기능을 가진 요소는 가능한 한 동일한 형태와 Interaction을 사용합니다.

버튼, Window control, selection, focus 등의 동작은 시스템 전체에서 예측 가능해야 합니다.

다만 Context에 따라 다른 동작이 더 자연스러운 경우 형식적인 일관성을 위해 이를 억지로 통일하지 않습니다.

### Clarity

사용자가 현재 어떤 상태에 있으며 무엇을 선택하고 무엇을 실행할 수 있는지 이해할 수 있어야 합니다.

시각적인 장식이나 새로운 추상화 때문에 정보 구조가 불명확해져서는 안 됩니다.

### Simplicity

사용자의 현재 목적에 필요하지 않은 기능과 UI를 불필요하게 노출하지 않습니다.

단순함은 기능을 무조건 제거하는 것이 아니라 필요한 기능이 필요한 순간에 명확하게 보이도록 하는 것을 의미합니다.

### Responsiveness

사용자의 입력에 즉각적이고 자연스럽게 반응하는 인터페이스를 목표로 합니다.

Surface 탐색, Window 조작, Item 실행, Directory navigation 등의 기본 Interaction은 지연이나 불필요한 전환 없이 이어져야 합니다.

## Design Tokens

색상, 글꼴, 간격, 모서리 반경, 그림자, 애니메이션 등의 공통 시각적 값은 가능한 한 중앙에서 관리합니다.

동일한 의미를 가진 값을 여러 Component에 반복해서 hardcode하지 않습니다.

구체적인 Design Token은 시각적 방향이 발전함에 따라 조정할 수 있습니다.

## Accessibility

가능한 범위에서 다음을 고려합니다.

- Keyboard navigation
- 명확한 focus state
- 충분한 contrast
- Pointer 이외의 interaction
- 상태를 색상만으로 전달하지 않는 표현

특히 Surface와 같이 주요 작업 진입점이 되는 interface는 Keyboard만으로도 주요 탐색과 실행이 가능하도록 설계합니다.

## Design Evaluation

새로운 UI나 Interaction을 추가할 때 기존 운영체제에 존재한다는 이유만으로 추가하지 않습니다.

다음과 같은 질문을 기준으로 평가합니다.

1. 사용자가 하려는 작업에 더 직접적으로 접근할 수 있는가?
2. 불필요하게 Application이나 시스템 구조를 의식하게 만들지는 않는가?
3. 같은 의도를 여러 UI로 중복해서 노출하지 않는가?
4. 기존의 익숙한 Interaction을 변경할 충분한 이유가 있는가?
5. 새로운 개념을 학습해야 하는 비용보다 얻는 이점이 큰가?
6. 실제 Content와 Item보다 시스템 UI가 앞에 나오고 있지는 않은가?

Echo OS의 디자인은 기존 데스크톱과 다르게 보이는 것을 목표로 하지 않습니다.

사용자가 시스템을 조작하는 것보다 시스템을 통해 하려던 일에 집중할 수 있도록 만드는 것을 목표로 합니다.
