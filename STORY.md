



# PATH STRUTURE

## BASE_DIR:
```
skills/
    | <skill-name>/
agents/
    | <agents-name>/
story/
    | <000>-<story-name>/
```

## `<skill-name>`

```
<skill-name>/
    | SKILL.md
```

## `<agents-name>`

```
<agents-name>/
    | skills/
    |     | <skill-name>/
    | AGENT.md
```


## `<000>-<story-name>`

000 = Incremental number

```
<000>-<story-name>/
    | log/LOG*.md
    | STORY.md
    | TASK*.md
```


# FILES: 

## SKILL.MD
```
---
name: s1
description:
---
```

## AGENT.MD
```
---
name:
description:
skills: s1. ( can be pick from base dir , or agent dir)
---
```


## STROY.MD
```
---
name:
description:
agents: a1 ( can be pick from base dir )
skills: s1 ( can be pick from base dir or agent selected )
---
```

## TASK-000-`<taskname>`.MD

000 : Incremental

```
---
name:
description:
agents: a1 ( can be pick from base dir )
skills: s1 ( can be pick from base dir or agent selected )
prompts: (A string as main prompt)
---
```

## LOG-000-001-`<log-name>`.MD

000-001 : TASK number - Incremental

```
---
name:
description:
task:
---

### prompts: 
### task-content:
### result:
```

# Interface : 

## Manage function. 

For TASK / SKILL / AGENTS / STORY 
- create, update, check, valide , auto validate ( rename file and path from header, ), etc. 


## is Done ? . 

Function to test TASK and STORY done : 
TASK is done is no '[ ]', or 'TODO' is find in the content of the file. 
STRORY is done if all the TASK in the story are done


## Execution Task : 

return {
    story: "", # path to the STORY.md
    agents: [], # List of path to AGENT.md ( union of  task.agents story.agents )
    skilll: [], # List of SKILL.md ( union of  task.skill, agents.skill, sorty.skill, story.agents.skill )
    prompt: "" , # in the TASK header,
    task: "", # path to the TASK*.md 
}



# TS module: 

Package to manage this files systeme in a application , do not make the app , only the package with a clea interface 
i whan the package exaustif so reveiw the documentation and add missing peace if need. 
the package must be self fussisant, a config.ts with constant must manage the constant need to the pakage ( BASE-DIR etc . )

