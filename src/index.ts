import { completeClickQuest, createClickQuest } from './quest'

export * from './quest'

createClickQuest({
    name: 'test',
    description: 'd',
})

console.log(completeClickQuest('BlG5k9GX-'))
