# Echo OS Web

Echo OS는 웹 브라우저에서 직접 사용해볼 수 있는 **Concept OS**입니다.

실제 커널을 구현하는 운영체제가 아니며, 기존 데스크톱 OS의 사용 방식을 다시 설계해보고 그 가능성을 실험하기 위한 프로젝트입니다.

## 핵심 질문

> Application 중심이라는 기존 전제를 내려놓고, 사용자 작업 중심으로 OS가 다시 설계된다면?

통상적으로 기존의 OS는 Application이 전용 Window를 소유하는 방식이었습니다. Echo OS는, **사용자가 수행하려는 작업을 중심으로 사고하도록 유도하는 것**을 실험합니다.

## 핵심 개념

Echo OS는 Application마다 전용 Window를 만드는 구조 대신 **Surface**라는 작업 공간을 중심으로 동작하는 방식을 실험하고 있습니다.

```mermaid
Desktop --> Surface
Surface --> Tab1["Tab"]
Surface --> Tab2["Tab"]
Surface --> Tab3["Tab"]

Tab1 --> Item1["Item"]
Tab2 --> Item2["Item"]
Tab3 --> Application
```

Surface 안에서는 File, Folder, Application과 같이 서로 다른 Item을 하나의 작업 흐름 안에서 Tab으로 다룰 수 있습니다.

Echo OS의 관점은 Application의 제거가 아닙니다. Application은 사용자가 원하는 기능을 제공할 뿐, **사용자가 선택해야 할 대상이 아니다**고 봅니다.

## 진행 상황

현재 프로토타입에는 다음과 같은 기반 기능이 구현되어 있습니다.

- 이동·크기 조절·최소화·최대화·닫기가 가능한 Window System
- Taskbar와 실행 중 Window 관리
- 간단한 Virtual File System과 Files
- Item / Application을 함께 찾는 Universal Search (이후 Surface Window로 전환 예정)
- File과 Directory의 Item 실행
- `.txt` Item을 직접 여는 read-only Text Viewer
- 최근 실행한 Item을 보여주는 in-memory Recent
- 같은 `.txt` Item을 다시 선택했을 때 기존 Window로 돌아가는 reuse 실험
- Files의 현재 Directory에 따라 Window title이 바뀌는 Item-oriented identity 실험

## 최종 목표

Echo OS의 목적은 기존 OS보다 절대적으로 우월한 방식을 증명하는 것이 아닙니다. 다음과 같은 질문을 **구동되는 프로토타입을 통해 직접 검증하는 것**이 목적입니다.

- Application보다 Item을 먼저 선택하는 방식이 자연스러운가?
- 서로 다른 작업 대상을 하나의 Surface 안에서 다루는 것이 유용한가?
- Surface라는 작업 Context의 경계가 이해 가능한가?

## 데모

[](http://echo-os-web.vercel.app/)
