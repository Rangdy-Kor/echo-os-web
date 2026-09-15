# Design

## Overview

Echo OS의 디자인은 사용자가 시스템 자체보다 자신이 하려는 작업과
작업 대상에 집중할 수 있도록 하는 것을 목표로 합니다.

이 문서는 Echo OS의 개념 자체를 정의하거나 현재 구현 구조를 설명하는
문서가 아닙니다.

프로젝트의 개념과 목표는 `concept.md`를 참고하고,
현재 시스템 구조는 `architecture.md`를 참고합니다.

이 문서는 새로운 Interaction과 UI를 설계하거나 기존 디자인을
평가할 때 사용하는 장기적인 판단 기준을 정의합니다.

Echo OS의 디자인은 기존 데스크톱 환경과 다르다는 것 자체를 목표로
하지 않습니다.

익숙한 방식이 효과적이라면 유지하고, 기존 구조가 사용자의 작업을
불필요하게 방해하는 경우에만 다른 방식을 탐구합니다.

## Interaction Principles

### Work First

사용자가 시스템을 조작하는 과정보다 실제로 하려는 작업을 우선합니다.

새로운 Interaction을 설계할 때 다음 질문을 먼저 고려합니다.

> 사용자가 실제 작업에 도달하기 위해 거쳐야 하는 단계인가?

Application을 실행하거나, Window를 관리하거나, 특정 UI를 거치는
과정이 사용자에게 실제로 필요한 선택이 아니라면 줄이거나 시스템이
처리할 수 있습니다.

반대로 사용자가 직접 선택하는 것이 의미 있는 경우에는 그 선택을
숨기지 않습니다.

목표는 단계의 수를 무조건 줄이는 것이 아니라 불필요한 시스템 조작을
줄이는 것입니다.

### Item First

사용자가 작업하려는 대상이 명확한 경우에는 그 대상이 Interaction의
중심이 되어야 합니다.

예를 들어 사용자가 특정 File을 열려고 한다면 핵심 대상은 그 File이며,
그것을 처리하는 Application은 작업을 가능하게 하는 수단일 수 있습니다.

따라서 가능한 경우 UI의 identity와 navigation은 사용자가 다루는
대상을 중심으로 표현합니다.

Application 자체가 사용자의 목적일 때는 Application을 직접적인
대상으로 표현할 수 있습니다.

Item First는 Application을 숨기는 규칙이 아니라 사용자에게 의미 있는
대상을 우선하는 원칙입니다.

### Progressive Exposure

사용자에게 필요한 정보와 선택지를 필요한 시점에 노출합니다.

모든 가능한 기능, Application, Action, System State를 처음부터
동시에 보여주지 않습니다.

사용자가 현재 해야 할 판단에 필요한 정보는 명확하게 보여주고,
아직 필요하지 않은 세부 구조는 뒤로 미룹니다.

이를 통해 인터페이스의 복잡도를 줄이되 기능 자체를 임의로 제한하지
않습니다.

Progressive Exposure는 정보를 숨기는 것이 목적이 아니라 사용자의
현재 맥락에 맞는 정보 밀도를 만드는 것입니다.

### Avoid Duplicate Intent

하나의 사용자 의도를 여러 UI 개념으로 중복해서 표현하지 않습니다.

예를 들어 동일한 작업을 시작하기 위해 서로 다른 이름의 버튼,
Launcher, Picker, Search UI가 반복적으로 존재한다면 각각이 실제로
서로 다른 역할을 가지고 있는지 검토합니다.

역할이 실질적으로 동일하다면 하나의 Interaction으로 통합하는 것을
우선합니다.

다만 겉보기에는 비슷한 Interaction이라도 서로 다른 Context에서
사용자의 의도가 다르다면 반드시 통합할 필요는 없습니다.

UI의 수를 줄이는 것 자체가 목적이 아니라 사용자가 같은 결정을
불필요하게 반복하지 않도록 하는 것이 목적입니다.

### Context over Uniformity

동일한 대상이나 기능이라도 사용자가 현재 위치한 Context에 따라
적절한 Interaction이 달라질 수 있습니다.

모든 곳에서 동일하게 동작하도록 만드는 것보다 사용자의 현재 작업
흐름을 보존하는 것을 우선합니다.

예를 들어 같은 Item을 실행하더라도 현재 작업 맥락 안에서 이어서
열어야 하는 경우와 새로운 작업 맥락으로 이동해야 하는 경우는
다르게 처리될 수 있습니다.

내부적으로 동일한 기능을 사용한다는 이유만으로 사용자-facing
navigation까지 동일하게 만들 필요는 없습니다.

일관성은 중요하지만 일관성 자체가 사용자의 Context보다 우선하지는
않습니다.

### Familiarity with Purpose

익숙한 Interaction에는 이유가 있습니다.

Window 이동, 크기 조절, Tab, File 탐색, Context Menu, 일반적인
Keyboard Shortcut과 같이 널리 이해되는 Interaction은 특별한 이유가
없다면 익숙한 동작을 유지합니다.

기존 방식을 변경할 때는 다음과 같은 명확한 이유가 있어야 합니다.

- 불필요한 단계를 제거한다.
- 작업 Context를 더 잘 보존한다.
- 중복된 시스템 개념을 제거한다.
- 사용자가 작업 대상을 더 직접적으로 다룰 수 있게 한다.
- Echo OS의 핵심 실험을 실제로 검증할 수 있게 한다.

단순히 기존 운영체제와 달라 보이기 위한 변경은 피합니다.

### Minimize System Mediation

사용자의 의도와 실제 작업 사이에 시스템이 불필요하게 개입하지
않도록 합니다.

가능하다면 사용자는 자신이 하려는 작업을 표현하고 시스템은 그 작업을
가능하게 하는 내부 구조를 처리합니다.

예를 들어 시스템이 이미 적절한 처리 방법을 알고 있는 경우 사용자가
매번 Application이나 Handler를 선택하도록 요구할 필요는 없습니다.

반대로 여러 선택지 사이의 차이가 사용자에게 의미가 있거나 결과에
영향을 준다면 선택권을 제공합니다.

자동화는 사용자 의도를 추측해서 대신 결정하는 것이 아니라,
의미 없는 중간 선택을 제거하는 방향으로 사용합니다.

### Explicit Context Changes

사용자의 작업 Context를 변경하는 동작은 가능한 한 명확해야 합니다.

시스템이 편의를 위해 사용자를 다른 Context로 자동 이동시키거나,
기존 작업을 예상하지 못한 위치로 재배치하는 것을 피합니다.

특히 서로 다른 작업 Context 사이의 이동, 결합, 분리와 같이 사용자의
작업 구조를 바꾸는 Interaction은 사용자의 명시적인 행동을 우선합니다.

자동 재사용이나 중복 제거가 기술적으로 가능하더라도 사용자의
Context 경계를 침범한다면 적용하지 않습니다.

시스템의 효율성보다 사용자가 자신의 작업 위치를 이해하고 통제할 수
있는 것이 중요합니다.

## Surface Design

Surface는 사용자가 관련된 작업을 하나의 Context 안에서 이어갈 수
있도록 표현하는 공간입니다.

Surface의 디자인은 특정 Application의 UI를 감싸는 Container를 만드는
것보다 사용자의 작업 Context를 유지하는 데 초점을 둡니다.

따라서 Surface 안에서 표시되는 UI는 가능한 경우 다음을 우선합니다.

- 현재 작업 대상이 무엇인지 알 수 있어야 합니다.
- 관련된 작업 사이를 자연스럽게 이동할 수 있어야 합니다.
- 내부 Application 구조를 불필요하게 반복해서 노출하지 않아야 합니다.
- 사용자가 현재 Surface 안에 있다는 공간적 Context를 유지해야 합니다.
- 다른 Surface의 Context를 시스템이 임의로 침범하지 않아야 합니다.

Surface의 구체적인 Tab 구조, Search UI, Navigation 방식 등은
현재 구현에 따라 변경될 수 있습니다.

이 문서는 특정 Surface 구현을 고정하지 않습니다.

## Tab Design

Tab은 Surface 안에서 작업 대상을 표현할 수 있는 Interaction입니다.

Tab을 Application instance와 동일한 개념으로 가정하지 않습니다.

가능한 경우 Tab의 identity는 현재 사용자가 다루는 작업 대상을
반영합니다.

예를 들어 File을 편집하는 Tab이라면 Application 이름보다 File의
identity가 더 중요할 수 있습니다.

Tab에서 Application identity가 사용자에게 실제로 의미 있는 경우에는
이를 표시할 수 있습니다.

Tab의 목적은 내부 실행 구조를 보여주는 것이 아니라 Surface 안의
작업 대상을 사용자가 이해하고 전환할 수 있도록 하는 것입니다.

Tab의 구체적인 lifecycle, reuse, reorder, 이동 방식 등은 현재
Interaction과 Architecture에 따라 발전할 수 있습니다.

## Application Design

Application은 사용자에게 기능을 제공하지만 항상 UI hierarchy의
중심일 필요는 없습니다.

Application 자체가 사용자의 대상인 경우에는 명확하게 표현합니다.

반면 사용자가 Item을 작업하고 있고 Application이 단지 이를 처리하는
수단이라면 Application identity를 반복적으로 강조하지 않습니다.

다음과 같은 중복 표현을 피합니다.

```text
Tab: Text Editor
Content heading: Text Editor
Window title: Text Editor
Toolbar: Text Editor
```

사용자가 실제로 작업하고 있는 것이 특정 File이라면 필요한 위치에서
File identity를 우선하는 것이 더 적절할 수 있습니다.

Application 이름을 제거하는 것 자체가 목적은 아닙니다.

각 위치에서 사용자에게 가장 의미 있는 identity를 표시하는 것이
목적입니다.

## Window Design

Window는 작업 공간을 배치하고 조작하기 위한 익숙한 Interaction으로
사용할 수 있습니다.

Echo OS는 Window라는 개념 자체를 제거하는 것을 목표로 하지 않습니다.

Window 이동, 크기 조절, 최소화, 최대화, 닫기와 같은 익숙한 Interaction은
사용자가 작업 공간을 직접 관리하는 데 유용한 경우 유지합니다.

그러나 Window와 Application을 항상 1:1 관계로 가정하지 않습니다.

Window의 존재가 내부 Application 구조를 그대로 사용자에게 노출해야
한다는 의미도 아닙니다.

Window chrome은 작업 내용보다 과도하게 강조되지 않아야 합니다.

## Navigation Design

Navigation은 사용자가 현재 작업 Context를 이해할 수 있도록 해야 합니다.

새로운 Navigation을 설계할 때 다음을 고려합니다.

- 사용자가 어디에 있는지 알 수 있는가?
- 이전 상태로 돌아갈 수 있는가?
- 현재 Context가 예상하지 못하게 바뀌지 않는가?
- 같은 의도를 반복해서 표현하도록 요구하지 않는가?
- Navigation이 내부 Architecture를 그대로 노출하고 있지는 않은가?

Back, Forward, Up과 같은 익숙한 Navigation은 의미가 명확한 Context에서
사용할 수 있습니다.

서로 다른 Context의 Navigation을 무리하게 하나의 전역 History로
통합하지 않습니다.

Navigation history는 가능한 경우 해당 Context를 소유하는 UI가
관리합니다.

## Search and Discovery

Search와 Discovery는 사용자가 시스템 구조를 먼저 탐색하지 않고도
원하는 작업 대상에 접근할 수 있도록 도울 수 있습니다.

Search는 특정 Application을 실행하기 위한 Launcher로만 제한하지
않습니다.

검색 가능한 대상은 프로젝트가 발전하면서 달라질 수 있으며,
현재 지원되는 결과 유형을 이 문서에서 고정하지 않습니다.

Search UI는 서로 다른 종류의 결과를 보여줄 수 있지만 사용자가
내부 type system을 이해하도록 요구해서는 안 됩니다.

결과의 종류는 필요한 경우 구분하되, 기술적인 분류를 과도하게
강조하지 않습니다.

Recent, Suggested와 같은 Discovery 기능도 사용자가 작업을 빠르게
이어갈 수 있도록 돕는 수단으로 봅니다.

Discovery 자체가 별도의 복잡한 작업 단계가 되지 않도록 합니다.

## Action Design

Action은 사용자가 현재 대상이나 Context에 수행하려는 행동을
표현합니다.

동일한 Action이 Keyboard Shortcut, Context Menu, Toolbar 등 여러
Interaction을 통해 호출될 수 있습니다.

이 경우 서로 다른 기능으로 구현하기보다 가능한 한 동일한 사용자
의도와 동작을 공유하도록 합니다.

Action의 가용성은 현재 Context에 따라 달라질 수 있습니다.

수행할 수 없는 Action을 억지로 실행하거나 다른 의미의 Action으로
대체하지 않습니다.

사용자가 현재 무엇에 Action을 수행하는지 명확해야 합니다.

## Visual Direction

Echo OS의 시각 디자인은 작업 내용보다 시스템 UI가 더 강하게
드러나지 않도록 합니다.

목표는 장식적인 미래형 OS를 만드는 것이 아니라 작업에 집중할 수 있는
차분하고 명확한 환경을 만드는 것입니다.

시각적인 결정은 다음을 우선합니다.

- 명확한 hierarchy
- 충분한 readability
- 낮은 시각적 소음
- 일관된 spacing
- 예측 가능한 interaction feedback
- 작업 대상의 명확한 identity
- 시스템 chrome의 절제

시각적 차별화를 위해 불필요한 장식이나 animation을 추가하지 않습니다.

Animation은 상태 변화나 공간적 관계를 이해하는 데 도움이 될 때
사용합니다.

## General UI Principles

### Prefer Content over Chrome

작업 내용이 시스템 UI보다 우선되어야 합니다.

Toolbar, Header, Label, Border 등은 실제 역할이 있을 때만 사용합니다.

기존 Application UI에서 흔하다는 이유만으로 Heading이나 Toolbar를
추가하지 않습니다.

### Avoid Redundant Labels

이미 Context를 통해 명확한 정보를 반복해서 표시하지 않습니다.

예를 들어 Tab이나 주변 UI에서 현재 작업 대상이 명확하다면 Content
영역에서 동일한 이름을 다시 크게 표시할 필요가 없는지 검토합니다.

반복이 orientation이나 accessibility에 실질적으로 도움이 되는
경우에는 유지할 수 있습니다.

### Preserve Spatial Context

사용자가 어떤 동작을 했을 때 결과가 어디에서 나타날지 예측할 수
있어야 합니다.

가능한 경우 현재 작업 공간 안에서 자연스럽게 결과를 연결합니다.

새 Window나 다른 Surface로 갑자기 이동시키는 동작은 그 변화가
사용자의 의도와 일치할 때 사용합니다.

### Clear Interactive States

Hover, Focus, Active, Selected, Disabled와 같은 상태는 서로 구분할 수
있어야 합니다.

특히 Keyboard interaction을 지원하는 UI는 Focus 상태를 시각적으로
확인할 수 있어야 합니다.

Selected와 Focused를 동일한 개념으로 취급하지 않습니다.

### Responsive to Available Space

Echo OS의 Window와 Surface는 크기가 변할 수 있으므로 UI는 고정된
크기만을 가정하지 않습니다.

공간이 좁아졌을 때 중요한 작업 내용이 단순히 잘리지 않도록 합니다.

Overflow가 필요한 경우 해당 Content를 소유하는 영역이 Scroll을
담당하도록 합니다.

불필요한 nested scrolling은 피합니다.

긴 이름이나 Content가 존재하더라도 전체 Layout을 예상하지 못하게
확장시키지 않도록 합니다.

### Editing Should Feel Local

Rename이나 Text Edit처럼 사용자가 특정 대상을 직접 수정하는
Interaction은 가능한 한 해당 대상과 공간적으로 가까운 위치에서
이루어지도록 합니다.

편집을 위해 불필요하게 별도의 Dialog나 화면으로 이동시키지 않습니다.

단, 복잡한 편집이나 추가 정보가 필요한 경우에는 별도의 UI가 더
적절할 수 있습니다.

## Keyboard and Focus Design

Keyboard Interaction은 현재 Focus와 Context를 존중해야 합니다.

Application, Window, Surface, Tab이 Active하다는 사실만으로 그 안의
모든 Keyboard Event를 가로채지 않습니다.

특히 Text Input이나 Editor가 Focus되어 있을 때 일반적인 Text Editing
동작을 방해하지 않습니다.

Keyboard Shortcut을 설계할 때 다음을 구분합니다.

```text
Focused Element
Active Work Target
Active Tab
Active Surface / Window
Global Environment
```

Shortcut은 필요한 최소 범위에서 동작해야 합니다.

더 좁은 Context가 Event를 의미 있게 처리해야 하는 경우 더 넓은
Context의 동작이 이를 침범하지 않아야 합니다.

Keyboard, Mouse, Context Menu 등 입력 방식이 달라도 같은 사용자
Action이라면 가능한 한 결과는 일관되어야 합니다.

## Feedback and State

사용자의 Action에 대한 결과는 이해할 수 있어야 합니다.

작업이 즉시 완료된다면 불필요한 Confirmation이나 Notification을
추가하지 않습니다.

반대로 상태 변화가 눈에 보이지 않거나 데이터 손실 가능성이 있다면
적절한 Feedback을 제공합니다.

Feedback의 강도는 Action의 중요도에 비례해야 합니다.

일상적인 작업마다 Toast, Modal, Confirmation을 반복적으로 표시하는
것은 피합니다.

사용자가 현재 상태를 UI 자체에서 자연스럽게 확인할 수 있다면
별도의 메시지를 추가하지 않는 것을 우선합니다.

## Destructive Actions

삭제처럼 복구하기 어렵거나 작업 손실을 일으킬 수 있는 Action은
일반적인 Action보다 신중하게 다룹니다.

다만 모든 destructive action에 무조건 Confirmation Dialog를 추가하는
것을 원칙으로 하지는 않습니다.

다음 요소를 함께 고려합니다.

- 복구 가능성
- 실수 가능성
- 피해 규모
- Action의 빈도
- 사용자의 기존 Context
- 명확한 Undo 가능 여부

안전성을 높이면서도 일상적인 작업 흐름을 불필요하게 방해하지 않는
방식을 선택합니다.

## Design Tokens

공통적인 시각 값은 가능한 경우 재사용 가능한 Token으로 관리합니다.

예:

- spacing
- radius
- typography
- surface/background levels
- borders
- shadows
- transition timing

Token은 시각적 일관성을 유지하기 위한 수단입니다.

단순히 모든 값을 추상화하기 위해 Token을 만들지는 않습니다.

실제로 반복되거나 시스템 전체에서 의미 있는 값을 중심으로
정의합니다.

## Accessibility

접근성은 별도의 후처리 단계가 아니라 기본 Interaction 설계의 일부로
고려합니다.

가능한 경우 다음을 지향합니다.

- Keyboard만으로 주요 Interaction을 수행할 수 있어야 합니다.
- Focus 위치를 확인할 수 있어야 합니다.
- Interactive element는 의미 있는 semantic structure를 사용합니다.
- Text와 UI는 충분한 readability를 가져야 합니다.
- 색상만으로 중요한 상태를 구분하지 않습니다.
- 작은 Window에서도 핵심 기능을 사용할 수 있어야 합니다.

Prototype이라는 이유만으로 기본적인 접근성을 의도적으로 무시하지
않습니다.

다만 실제 구현 범위는 현재 Prototype의 목적과 우선순위에 따라
결정합니다.

## Design Evaluation

새로운 기능이나 Interaction을 평가할 때 단순히 기존 OS와 다른지를
기준으로 삼지 않습니다.

다음 질문을 사용합니다.

1. 사용자가 실제로 하려는 작업에 더 직접적으로 접근할 수 있는가?
2. 불필요한 시스템 조작이나 선택을 줄였는가?
3. 사용자가 현재 작업 대상과 Context를 이해할 수 있는가?
4. 같은 의도를 여러 번 표현하도록 요구하지 않는가?
5. 내부 Architecture를 불필요하게 사용자에게 노출하지 않는가?
6. 사용자의 Context를 예상하지 못하게 변경하지 않는가?
7. 익숙한 Interaction을 변경했다면 그 변경에 실제 이유가 있는가?
8. 새로운 개념이 기존 개념과 역할이 중복되지 않는가?
9. 시스템 UI보다 실제 작업 내용에 집중할 수 있는가?
10. 실제 Prototype에서 사용해 보고 평가할 수 있는가?

모든 질문에 항상 긍정적인 답이 나와야 하는 것은 아닙니다.

서로 충돌하는 원칙이 있다면 현재 Interaction의 목적과 실제 사용
경험을 기준으로 판단합니다.

## Evolution

이 문서는 현재 UI의 세부 명세가 아니라 Echo OS의 디자인 판단 기준을
정의합니다.

따라서 다음과 같은 변화만으로 이 문서를 수정할 필요는 없습니다.

- 새로운 Context Menu 항목 추가
- 새로운 Keyboard Shortcut 추가
- Tab reorder 구현
- 새로운 File operation 추가
- 특정 Component 구조 변경
- Search result type 추가
- 현재 Layout의 세부 변경

이러한 내용은 구현 또는 Architecture 수준의 변화입니다.

반대로 다음과 같은 변화가 생긴다면 이 문서를 다시 검토합니다.

- 사용자 작업을 조직하는 방식에 대한 디자인 원칙이 바뀐 경우
- Surface나 Context를 다루는 UX 원칙이 바뀐 경우
- Item/Application을 사용자에게 표현하는 기준이 바뀐 경우
- Navigation 또는 system mediation에 대한 기본 방향이 바뀐 경우
- 기존 Interaction을 유지하거나 변경하는 판단 기준이 바뀐 경우

구체적인 UI는 계속 변화할 수 있지만 그 변화는 이 문서의 원칙을
실제로 시험하고 발전시키기 위한 것이어야 합니다.
