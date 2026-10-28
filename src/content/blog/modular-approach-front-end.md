---
title: 'Modular approach on structuring front-end application'
description: 'How a React and TypeScript team structures a feature-rich front-end: atomic design, API consuming and state management.'
scene: 'island'
pubDate: '2021-06-16'
canonicalUrl: 'https://anymindgroup.com/news/tech-blog/12055/'
---

Hi, my name is Pavel and I’m front-end developer at AnyMind ([AnyTag](https://anytag.jp/) & [AnyCreator](https://anymindgroup.com/products/anycreator/) platforms), in this article I’d like to introduce our front-end architecture and main approaches we are using to build scalable apps.\
~ [see our project history and backend architecture](https://anymindgroup.com/news/tech-blog/11513/)

For our team React + TypeScript works best: it is very flexible, stable, has great community support and can offer almost all possible 3rd party integrations or fancy charts every product might need, but it comes with the cost – project can easily become complicated. People come and go, features created and got buried at some far corners – those issues are very common across web development teams. That’s why very important is to keep thing structured, especially if your project grow fast (feature-rich).

Router will manage which page we need to render based on url, each page module can already access API to get the data it needs for building UI or determine which Organism needs to be rendered. For components composition we are using [Atomic design methodology](https://atomicdesign.bradfrost.com/chapter-2/) which may look something like this

```
...
 - assets
 - pages
 - templates
 - components
  - organisms
  - molecules
  - atoms
...
```

Such structure allows us to consider building blocks of our UI as chemical elements or biological organisms.\
Let’s have few examples of how they are might look:

- Atoms are some basic blocks like html elements (no other atoms or molecules imports)

```tsx
const Textarea = (props: TextareaProps) => {
  const { placeholder, error, disabled, ...field } = props;

  return (
    <Form
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      {...field}
    />
  );
};
```

- Molecules are goups of atoms based on functionality (can have other atoms imported)

```tsx
import { PalleteButton } from '@atoms/Button';

const ActionButtons = (props: ActionButtonsProps) => {
  const { hasTopBorder = false, className } = props;

  return (
    <Wrapper className={className} hasTopBorder={hasTopBorder}>
      <PalleteButton
       {...some props}
      />
      <PalleteButton
        {...some props}
      />
    </ApplyWrapper>
  );
};
```

- Organisms are a combination of molecules and atoms which refer to some UI section or widget (some feature or part of the page you can easily distinguish)

### Key benefits are:

- better code modularity and feature isolation
- helps to maintain consistency and reduce duplications
- UI itself could be easily separated from logic if needed and reused with some new context

We can use hooks for custom API calls or use [component composition](https://reactjs.org/docs/context.html#before-you-use-context) – both ways are good enough to solve most of upcoming problems. Or course there is always a tradeoff in software development..

### Downsides might be:

- it is tempting to reuse too much, so components becomes too complex
- different layouts may affect organisms styles (need to consider context of usage)

## ■ API consuming
Starting from the `page` level each module can access API endpoint to fetch\|mutate data it needs, go down this road we can build any combination of those elements and easily organise data-flow.

For API management our team is using [Apollo client](https://github.com/apollographql/apollo-client) which provides us its own hooks for querying or mutating data, but other solutions will fit this approach as well. Most of basic data fetching scenarios might be covered with following pattern: module root will do API call and handle errors, once data is obtained template will just render it:

```tsx
const CompaniesList = (props: ListProps) => {
  const { currentPage, filter } = props;

  const { data, loading } = useQuery<
    BusinessAssociateCompanies,
    BusinessAssociateCompaniesVariables
  >(ALL_ASSOCIATED_COMPANIES, {
    variables: {
      offset: getOffset(currentPage),
      limit: LIMIT,
      keyword: filter.keyword,
      agencyId,
    },
    onError: (error) => {
      enqueueSnackbar(t(err.message), { variant: "error" });
    },
  });

  if (loading) {
    return <ListIndicator />;
  }

  const pageInfo = getPageInfo(currentPage, data);

  return (
    <Template
      associatedCompanies={data?.businessAssociateCompanies}
      filter={filter}
      pageInfo={pageInfo}
    />
  );
};
```

If we will need to reuse this template somewhere else it’s easy to import it in another index file, call another API and pass down data which we will get from it. Of course there might be many much more complex data-fetching scenarios, but general approach will be the same.

## ■ State management
Maybe the most arguable and complex thing on modern web development is application state management, folks well familiar with React could name dozens of `npm i` solutions for this problem, but since the time React team introduced hook – things got changed. It is way more easy to keep your app logic encapsulated with hooks – which may lead us to conclusion that React itself could provide enough tools to not have to use any 3rd party state management solution (or minimise it). We will not go deep into the woods here, just roughly describe our current approach as one of the possinble solution our team came up with.

Our app has relatively small global state which accessible through React.Context API, we store few things which is used across the app, like user data from token.

```tsx
export const AdminStoreProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer<
    React.Reducer<StateType, Dispatch<Action>>
  >(reducer, initialState);
  const value = { state, dispatch };

  return <AdminStore.Provider value={value}>{children}</AdminStore.Provider>;
};
```

We have single reducer for this store

```tsx
const reducer = (state: StateType, { type, payload }: ActionType) => {
  switch (type) {
    ...
    case 'AUTH_USER':
      return {
        ...state,
        ...payload
      }
    ...
}
```

Anytime we need to put something into our global store we need to dispatch some action with payload, need to define proper action type to handle it into app reducer

```tsx
const dispatchAuthUser = (props: AuthUserProps) => {
  dispatch({
    type: "AUTH_USER",
    payload: props,
  });
};
```

Finally we can define consumer hook and use it in any UI module we need

```tsx
export const useAuthData = () => {
  const {
    state: { userId, role },
    dispatch,
  } = useContext(AdminStore);

  return {
    auth: {
      userId,
      role,
    },
    dispatch,
  };
};
```

All local state we are trying to keep closer to the view to avoid prop drilling problem and not make unrelated parts re-render due to state changes. Of course there might be some really complex problems where simple composition can’t give us desired outcome – there we might use React.Context again or some small state management libs like [recoil](https://github.com/facebookexperimental/Recoil) or [jotai](https://github.com/pmndrs/jotai).

## ■ Conclusion
Structuring your app might be quite complex task, many thing needs to be considered and tradeoffs mist be measured carefully, having some opinionated approach is essential to keep things moving forward. Just try to keep things simple as much as possible – most of our time we are reading code rather that writing it, that’s why it is very important to keep things organised to reduce cognitive load on developers and let them focus on solving business problems rather than arguing about libs to use or styles to apply. Thank you for reading, I hope you can get some useful ideas here. See you next time!
