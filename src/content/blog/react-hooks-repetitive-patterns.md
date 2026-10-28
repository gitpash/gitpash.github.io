---
title: 'How to recognize repetitive patterns and optimize them with React Hooks'
description: 'Finding repeated logic in list and detail UIs and moving it into reusable hooks.'
pubDate: '2021-10-06'
canonicalUrl: 'https://anymindgroup.com/news/tech-blog/15373/'
---

Photo by [Efe Kurnaz](https://unsplash.com/@efekurnaz?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

Hi, my name is Pavel and I’m front-end developer at AnyMind ([AnyTag](https://anymindgroup.com/products/anytag/) & [AnyCreator](https://anymindgroup.com/products/anycreator/) platforms) and today I’d like to talk about how we are using [react hooks](https://reactjs.org/docs/hooks-intro.html) to simplify our codebase, eliminate repetitive patterns and how you can recognize them.

*"Can we reuse it?"* or *"You can refactor this as util function and reuse later"* – I believe everyone is well familiar with such code review comments, the reason for that is very simple – code reusability is one of the most important topics among software developers. The way we are implementing our components and how we are structuring our business logic is always the top of all priorities for every application development process. When we are thinking about the scalability of our codebases, reusability should be considered in the first place, with it implemented successfully we will get a better application: with less code and often more readable one.

Of course there is no silver bullet, especially when it comes to generalization of any sort, the point of view on this problem will vastly depend on the library(framework) being used or established practices, which data streaming paradigm is utilised: if it is bi-directional or uni-directional will end up of seeing different picture. The idea is to find the right balance between reusability and speed which suits you and your team, minimise the effort of implementation and provide some productivity boost, rather than looking for "the best solution possible" or trying to make every bit of code be able to fit all needs.

### closer to the matter

On our platform, like on many others, users are interacting with a lot of Lists – visual data represented as a sequence of items, for example "posts list", where you can scroll through and click on to get detailed information, in our case it will open a modal with details.

Of course, one can write such UI + logic every time if there is a need for it, but we don’t want that, we want [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) and [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) by any means, so let’s try to abstract out business logic from the presentation level as well as recognize several repetitive patterns or shared functions among the possible use cases:

- Interaction Handlers (OnClick, OnEdit, OnDelete, etc.)
- Local state (siblings ids, some group selection ids, some item attributes)
- Utilities for accessing URL parameters (placing post_id into url is very common)
- Navigation between items
- Calculations (determine siblings, increment or decrement counters, apply filters)

Using the Hook approach, we can define and incapsulate this logic in isolation and connect with UI we want later, start early and don’t overthink it – you can always add more customisation if needed (or remove if no use), but don’t put too much logic into one place due to possible readability and maintainability issues – better create more functions if business requirements grow and current function expanded.

```tsx
type SiblingIdType = number | null;
interface ItemsType extends Record<string, any> {
  id: SiblingIdType;
}

const usePostDetailModal = (itemsArray: ItemsType[], paramName: string | undefined = 'postId') => {
  // access the URL parameters
  const { pathname, search } = useLocation();
  const history = useHistory();
  // local state
  const [openedPostId, setOpenedPostId] = useState<SiblingIdType>(null);
  const [siblingPostId, setSiblingPostId] = useState<{ prevId: SiblingIdType; nextId: SiblingIdType }>({
    prevId: null,
    nextId: null
  });
  // utilities for URL manipulation and siblings calculation
  const setQueryParams = (postId: SiblingIdType) => {
    const urlParams = getUrlParamsFromSearch(pathname, search, { [paramName]: postId });

    history.replace(`${urlParams.pathname}${urlParams.search}`);
  };
  const getSiblingPostId = (postId: SiblingIdType) => {
    if (itemsArray.length) {
      const currentIndex = itemsArray.findIndex(item => item.id === postId);
      const prevId = currentIndex === 0 || itemsArray.length <= 1 ? null : itemsArray[currentIndex - 1].id;
      const nextId = postsData.length > currentIndex + 1 ? postsData[currentIndex + 1].id : null;

      setSiblingPostId({ prevId, nextId });
    }
  };
 // handlers
  const handleClickPost = (id: number) => {
    setOpenedPostId(id);
    setQueryParams(id);
    getSiblingPostId(id);
  };
  const handleClickNext = () => {
    getSiblingPostId(siblingPostId.nextId);
    setQueryParams(siblingPostId.nextId);
    setOpenedPostId(siblingPostId.nextId);
  };
  const handleClickPrev = () => {
    getSiblingPostId(siblingPostId.prevId);
    setQueryParams(siblingPostId.prevId);
    setOpenedPostId(siblingPostId.prevId);
  };
  const handleClosePostDetail = () => {
    setOpenedPostId(null);
    setQueryParams(null);
  };

  return {
    // expose parameters and handlers you need
    ...
  };
};
```

Then whenever you need to add such functionality to any Lists, simply call this hook, then provide `items_array` and `paramName` for URL if needed. Even if you have multiple instances on the page – there will be no issues with that 🎉

```tsx
const { openedPostIdOne, handleClickOne, ...restHandlers1 } = usePostDetailModal([🌝,🌕,🌚], "url_param_1");
const { openedPostIdTwo, handleClickTwo, ...restHandlers2 } = usePostDetailModal([📦,📦,📦], "url_param_2");

return (
  <>
    <ListOne>
      ...
      <Item onClick={handleClickOne}>
      ...
    </ListOne>
    <ListTwo>
      ...
      <Item onClick={handleClickTwo}>
      ...
    </ListTwo>

    <ModalOne title="Modal 1" open={openedPostIdOne} {...restHandlers1}>
      // content of Modal 1
    </ModalOne>
    <ModalTwo title="Modal 2" open={openedPostIdTwo} {...hrestHandlers2andlers2}>
      // content of Modal 2
    </ModalTwo>
  </>
);
```

Let’s take a look at another example: imagine you need to delete an item, but before you do – a confirmation window should appear to ensure this was intentional.

It sounds straightforward enough: implement the modal, provide handlers (trigger open\|close, delete, to show success\|fail message), keep some state(opened or closed, item id and name, loading state if needed) – as you can see that’s already a lot of boilerplate code and repetition, so we can apply Hooks approach here, for that first we can consider the logical part:

- Local state (id, loading, name)
- Handlers to manage modal state and call mutation (onClose, onOpen, onDelete)

We can stop here and already benefit from it, but if you think about the modal itself – it will be almost the same UI all over the place, with small text or title variations. Given this fact, let’s try to include a modal into the hook itself, so it will include:

- Local state (id, loading, name)
- Handlers to manage modal state and call mutation (onClose, onOpen, onDelete)
- Rendered modal

Now we can put all the pieces together, just do not forget about [memoization](https://en.wikipedia.org/wiki/Memoization) to be applied on UI returning from hook

```tsx
interface DeleteModalProps {
  handleDelete: () => void;
  dialogTitle?: string;
}
const useDeleteModalWithState = ({
  handleDelete,
  dialogTitle = 'Are you sure you want to delete it?'
}: DeleteModalProps) => {
  const { t } = useTranslation();
  const [deletingItem, setDeletingItem] = useState<{ id: number; name: string; loading?: boolean }>({
    id: 0,
    name: '',
    loading: false
  });

  const handleClickDelete = (id: number, name: string) => {
    setDeletingItem({ name, id });
  };
  const handleCloseDialog = () => {
    setDeletingItem({ id: 0, name: '', loading: false });
  };
  // we need to add memoization here to prevent the modal from unexpected re-renders
  const DeleteModal = useMemo(
    () => (
      <Dialog
        open={!!deletingItem.id}
        title={`${t(dialogTitle, { name: deletingItem.name })}?`}
        execute="Delete"
        handleExecute={handleDelete}
        onClose={handleCloseDialog}
        loading={deletingItem.loading}
        disabled={deletingItem.loading}
      />
    ),
    // provide dependency array to help React understand when you need to re-render UI
    [deletingItem.id, deletingItem.name, deletingItem.loading]
  );

  return {
  // expose DeleteModal, state and handlers needed
  ...
  };
};
```

Then in order to use it, you just need to define the appropriate mutation and pass it to hook, the rest will be handled for you:

```tsx
const [deleteWithCaution] = useMutation(MY_MUTATION, {
  /* provide payload and handle error case */
});
const { DeleteModal, ...handlers } = useDeleteModalWithState({
  handleDelete: deleteWithCaution,
  // any title or text that suits the current use case
});

return (
  <>
    ...
    <Item onClick={() => handlers.handleClickDelete(itemId, itemName)} />
    {DeleteModal}
    ...
  </>
);
```

## Conclusion:

By implementing your application logic this way, you will not only help your team save some development time, but will also help you maintain consistency across similar features. If you want to reuse the same hook, you’ll have to consider keeping your data flow the same and compose components in a similar way. It will also help you shape your APIs and even predict some possible flaws due to previously implemented functions sharing similar approaches. Eventually your app will have distinctive recognisable patterns of data usage and UI composition which is just perfect for maintainability, possible architectural changes and overall nice to work with and reason about. I hope these simple practical examples and general ideas will help you make your own product better, thank you for reading.
