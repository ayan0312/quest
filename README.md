# mvvm
This is the repository for mvvm

## Quickstart

- Start via [yarn](https://yarnpkg.com/):

  ```bash
  yarn dev
  yarn build
  ```

## Example

```html
<div v-on:click="myClick"></div>
<div v-style="myStyle"></div>
<div v-show="display"></div>
<div v-show:display></div>
<div v-class="myClass"></div>
<div v-model="myModel"></div>
<div v-ref="myRef"></div>
<div v-for="(item,index) in list"></div>
<div v-text="myText"></div>
<div v-html="myHTML"></div>
```

```javascript
import { createVM, MVVMComponent } from './mvvm.esm.js'
const MyTitle = {
    data() {
        return {
            title: '标题',
        }
    },
    template: `
        <div class="test">
            <h1 v-ref="title1"> {{ title }}1 </h2>
            <h2> {{ title }}2 </h2>
            <slot></slot>
            <label>
                标题：
                <input v-model="title" type="text" placeholder="修改标题" />
            </label>
        </div>
    `
}

const MyFooter = {
    data() {
        return {
            title: '尾部',
        }
    },
    template: `
        <div class="test">
            <h1 v-ref="title1"> {{ title }} </h2>
        </div>
    `,
    mounted() {
        this.$refs.title1.textContent = '尾部:ref取element改变文字'
        console.log('before nextTick')
        this.$nextTick().then(() => {
            console.log('nextTick(micro)')
        })
        console.log('after nextTick')
    }
}

const vm = createVM({
    element: '#app',
    components: {
        'my-title': MyTitle,
        'my-footer': MyFooter
    },
    data: {
        number: {
            input: 0,
            click: 0
        },
        p: '这里是内容',
        display: true,
        tempObject: {},
        fontSizeStyle: { 'font-size': '14px' },
        inputNumberOver100Times: 0,
        numberInputClass: 'red',
        inputClassesIndex: 0,
        inputClasses: ['red', 'blue', 'yellow', 'grey', 'gold', 'black', 'white']
    },
    computed: {
        getInformation() {
            return `点击次数:${this.number.click} 增量:${this.number.input}`
        },
        getInputNumberOver100TimesInformation() {
            return `增量超过100的次数:${this.inputNumberOver100Times}`
        },
        getNewObject() {
            const a = this.tempObject.test
            return a ? `${a.name}` : a
        }
    },
    watch: {
        "number.input": function (newVal, oldVal) {
            if (newVal >= 100 && oldVal < 100)
                this.inputNumberOver100Times += 1
        },
        "number.click": function (newVal, oldVal) {
            this.fontSizeStyle = {
                'font-size': 14 + newVal + 'px'
            }
        },
        "inputNumberOver100Times": function () {
            this.$emit('over100Times')
        }
    },
    methods: {
        setNewObject(e) {
            this.tempObject.test = {
                name: 'test'
            }
            console.log('create test', this.tempObject)
        },

        deleteNewObject(e) {
            if ('test' in this.tempObject) {
                delete this.tempObject.test
            }
            console.log('delete test', this.tempObject)
        },
        displayController(e) {
            this.display = !this.display
        },
        increaseClickNumber() {
            this.number.click += 1
            this.$emit('click')
        },
        increase1(e) {
            this.number.input += 1
            this.increaseClickNumber()
        },
        increase10(e) {
            this.number.input += 10
            this.increaseClickNumber()
        },
        decrease10(e) {
            this.number.input -= 10
            this.increaseClickNumber()
        },
        switchInputTextColor(e) {
            this.inputClassesIndex += 1
            if (this.inputClassesIndex === this.inputClasses.length)
                this.inputClassesIndex = 0
            this.numberInputClass = this.inputClasses[this.inputClassesIndex]
            this.increaseClickNumber()
        }
    }
});

vm.$on('click', function () {
    console.log('clickNumber:', this.number.click)
})

vm.$once('over100Times', function () {
    console.log('over 100!')
})

const cVM = new MVVMComponent(MyTitle)
cVM.$mount('#app2')
```