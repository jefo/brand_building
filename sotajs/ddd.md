# Руководство по проектированию Доменного слоя в SotaJS

## Цель документа
Это приложение к основному руководству SotaJS, которое фокусируется исключительно на проектировании доменного слоя. Здесь вы найдете практические рекомендации по созданию Value Objects, Entities и Aggregates с использованием инструментов фреймворка.

## Философия доменного слоя в SotaJS

Доменный слой - это сердце вашего приложения, где живут бизнес-правила и терминология предметной области. В SotaJS этот слой строится на трех ключевых принципах:

- **Изоляция**: Доменные объекты не знают о базах данных, веб-фреймворках или UI
- **Единый язык**: Код говорит на языке бизнеса через семантические имена
- **Чистота**: Логика описывается через чистые функции и методы

## Value Objects (Объекты-значения)

### Когда использовать Value Object?
Используйте Value Object когда:
- Объект описывает характеристику, а не уникальную сущность
- Два объекта с одинаковыми атрибутами взаимозаменяемы
- Не нужна история изменений или отслеживание идентичности

### Критерии выбора:
- Задайте вопрос: "Важна ли мне история этого объекта или его конкретный экземпляр?"
- Если ответ "нет" - это Value Object

### Пример создания:
```typescript
import { z } from 'zod';
import { createValueObject } from '@maxdev1/sotajs';

const MoneySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3)
});

export const Money = createValueObject(MoneySchema, 'Money');
export type Money = ReturnType<typeof Money.create>;

// Использование
const price = Money.create({ amount: 100, currency: 'USD' });
```

## Entities (Сущности)

### Когда использовать Entity?
Используйте Entity когда:
- Объект имеет уникальную идентичность в системе
- Нужно отслеживать изменения состояния во времени
- История объекта важна для бизнеса

### Критерии выбора:
- Задайте вопрос: "Нужно ли мне отслеживать этот объект с течением времени?"
- Если ответ "да" - это Entity

### Пример создания:
```typescript
import { z } from 'zod';
import { createEntity } from '@maxdev1/sotajs';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string()
});

export const User = createEntity(UserSchema, 'User');
export type User = ReturnType<typeof User.create>;

// Использование
const user = User.create({ id: 'uuid', email: 'test@example.com', name: 'John' });
```

## Aggregates (Агрегаты)

### Когда создавать Aggregate?
Создавайте Aggregate когда:
- Бизнес-правило требует атомарного изменения нескольких объектов
- Нужно обеспечить транзакционную целостность группы объектов
- Объекты защищают общий инвариант

### Процесс проектирования агрегатов:
1. Найдите инварианты - правила, которые всегда должны быть истинными
2. Сгруппируйте объекты, защищающие один инвариант
3. Определите корень агрегата - главную сущность
4. Используйте createAggregate с указанием entities, computed свойств и инвариантов

### Пример агрегата Order:
```typescript
import { z } from 'zod';
import { createAggregate, createEntity } from '@maxdev1/sotajs';

// Дочерняя сущность OrderItem
const OrderItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  price: z.number().positive()
});

const OrderItem = createEntity(OrderItemSchema, 'OrderItem');

// Схема агрегата Order
const OrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered']),
  items: z.array(OrderItemSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const Order = createAggregate({
  name: 'Order',
  schema: OrderSchema,
  
  entities: {
    items: OrderItem  // Коллекция сущностей OrderItem
  },
  
  computed: {
    totalAmount: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    isPaid: (state) => state.status === 'paid',
    canBeCancelled: (state) => ['pending', 'paid'].includes(state.status)
  },
  
  invariants: [
    (state) => {
      if (state.status === 'paid' && state.items.length === 0) {
        throw new Error('Cannot pay for empty order');
      }
      if (state.status === 'shipped' && !state.items.every(item => item.quantity > 0)) {
        throw new Error('All items must have positive quantity before shipping');
      }
    }
  ],
  
  actions: {
    addItem: (state, productId: string, quantity: number, price: number) => {
      const newItem = OrderItem.create({
        id: generateId(),
        productId,
        quantity,
        price
      });
      state.items.push(newItem.state);
    },
    
    removeItem: (state, itemId: string) => {
      state.items = state.items.filter(item => item.id !== itemId);
    },
    
    markAsPaid: (state) => {
      if (state.status !== 'pending') {
        throw new Error('Only pending orders can be paid');
      }
      state.status = 'paid';
      state.updatedAt = new Date();
    },
    
    shipOrder: (state) => {
      if (state.status !== 'paid') {
        throw new Error('Only paid orders can be shipped');
      }
      if (state.items.length === 0) {
        throw new Error('Cannot ship empty order');
      }
      state.status = 'shipped';
      state.updatedAt = new Date();
    }
  }
});

export type Order = ReturnType<typeof Order.create>;
```

## Лучшие практики проектирования

### ✅ Правильные подходы:
- **Моделируйте поведение, а не данные**: Создавайте методы типа `order.pay()`, `user.activate()`
- **Защищайте инварианты внутри агрегатов**: Используйте параметр `invariants` в createAggregate
- **Используйте вычисляемые свойства**: Определяйте `computed` свойства для производных значений
- **Ссылайтесь на другие агрегаты по ID**: Храните `customerId`, а не полный объект Customer

### ❌ Избегайте:
- **Анемичных моделей**: Классы только с get/set без бизнес-логики
- **Прямых сеттеров состояния**: Обход бизнес-правил через прямое изменение полей
- **Прямых ссылок на другие агрегаты**: Проблемы с консистентностью и производительностью
- **Слишком больших агрегатов**: Дробите на меньшие, сфокусированные агрегаты

## Процесс проектирования домена

### Шаг 1: Анализ предметной области
- Определите ключевые бизнес-концепции
- Выявите инварианты и бизнес-правила
- Составьте глоссарий единого языка

### Шаг 2: Создание Value Objects
- Начните с простейших концепций
- Создавайте Value Objects для описательных понятий
- Используйте Zod для валидации

### Шаг 3: Определение Entities
- Выявите сущности с уникальной идентичностью
- Определите жизненный цикл каждой сущности
- Создайте Entities с помощью createEntity

### Шаг 4: Группировка в Aggregates
- Найдите группы объектов, защищающих общие инварианты
- Определите корни агрегатов
- Используйте createAggregate с правильной конфигурацией

### Шаг 5: Рефакторинг и оптимизация
- Дробите слишком большие агрегаты
- Оптимизируйте границы транзакций
- Убедитесь в слабой связанности между агрегатами

## Работа с вложенными сущностями

SotaJS поддерживает богатые доменные модели с вложенными сущностями:

```typescript
// Создание агрегата с вложенными сущностями
const Order = createAggregate({
  name: 'Order',
  schema: OrderSchema,
  entities: {
    customer: CustomerInfo,     // Одиночная вложенная сущность
    items: OrderItems,          // Коллекция сущностей
    shipping: ShippingDetails   // Еще одна сущность
  },
  // ... остальная конфигурация
});

// Доступ к методам вложенных сущностей
order.actions.updateCustomerAddress('Новый адрес');
order.entities.items[0].actions.updateQuantity(5);
```

## Тестирование доменного слоя

Доменные объекты в SotaJS легко тестируются благодаря чистоте и изоляции:

```typescript
// Тестирование агрегата
test('should calculate total amount correctly', () => {
  const order = Order.create({
    id: 'order-1',
    customerId: 'customer-1',
    status: 'pending',
    items: [
      { id: 'item-1', productId: 'product-1', quantity: 2, price: 100 },
      { id: 'item-2', productId: 'product-2', quantity: 1, price: 200 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  expect(order.totalAmount).toBe(400); // 2*100 + 1*200
});

// Тестирование инвариантов
test('should throw when paying empty order', () => {
  const order = Order.create({
    id: 'order-1',
    customerId: 'customer-1',
    status: 'pending',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  expect(() => order.actions.markAsPaid()).toThrow('Cannot pay for empty order');
});
```

## Заключение

Правильное проектирование доменного слоя - ключ к созданию поддерживаемой и гибкой системы. SotaJS предоставляет инструменты для создания богатых доменных моделей с соблюдением принципов DDD. Помните: начинайте с простых Value Objects, постепенно переходя к более сложным Entities и Aggregates, всегда сохраняя фокус на бизнес-логике и изоляции доменного слоя.