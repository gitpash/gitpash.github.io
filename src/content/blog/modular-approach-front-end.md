---
title: 'Modular approach on structuring front-end application'
description: 'How a React and TypeScript team structures a feature-rich front-end: atomic design, API consuming and state management.'
cover: 'blocks'
pubDate: '2021-06-16'
canonicalUrl: 'https://anymindgroup.com/news/tech-blog/12055/'
---

This article introduces our front-end architecture and the main approaches we use to build scalable apps.

For our team React + TypeScript works best: it is very flexible, stable, has great community support and can offer almost all possible 3rd party integrations or fancy charts every product might need, but it comes with the cost – project can easily become complicated. People come and go, features created and got buried at some far corners – those issues are very common across web development teams. That’s why very important is to keep thing structured, especially if your project grow fast (feature-rich).

<figure class="diagram"><svg class="wide" viewBox="0 0 900 470" role="img" aria-labelledby="dw-t dw-d"><title id="dw-t">Front-end architecture</title><desc id="dw-d">The router picks a page. Each page, which can reach the API through the network layer, composes organisms from molecules and atoms. The result goes to the user interface, and user actions go back to the network layer, which talks to the GraphQL API.</desc><defs><marker id="dah-w" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M1 1L9 5L1 9z"/></marker></defs><rect class="d-box d-api" x="300" y="8" width="200" height="40" rx="12"/><text class="d-text" x="400.0" y="33.25" text-anchor="middle" style="font-size:15px">GraphQL API</text><path class="d-arrow" d="M380 48V90" marker-end="url(#dah-w)"/><path class="d-arrow" d="M440 92V50" marker-end="url(#dah-w)"/><text class="d-note" x="372" y="74" text-anchor="end" style="font-size:13px">queries, mutations</text><text class="d-note" x="448" y="74" text-anchor="start" style="font-size:13px">data</text><rect class="d-layer" x="140" y="92" width="560" height="340" rx="18"/><text class="d-title" x="160" y="122">Network layer · API access</text><rect class="d-box " x="16" y="222" width="96" height="52" rx="12"/><text class="d-text" x="64.0" y="253.25" text-anchor="middle" style="font-size:15px">Router</text><path class="d-line" d="M112 248H128M128 185V339"/><path class="d-arrow" d="M128 185H162" marker-end="url(#dah-w)"/><rect class="d-box d-page" x="164" y="159" width="90" height="52" rx="12"/><text class="d-text" x="209.0" y="190.25" text-anchor="middle" style="font-size:15px">Page</text><path class="d-arrow" d="M254 185H282" marker-end="url(#dah-w)"/><rect class="d-box d-org" x="284" y="159" width="100" height="52" rx="12"/><text class="d-text" x="334.0" y="190.25" text-anchor="middle" style="font-size:15px">Organism</text><path class="d-arrow" d="M384 185H408" marker-end="url(#dah-w)"/><rect class="d-box d-mol" x="410" y="159" width="100" height="52" rx="12"/><text class="d-text" x="460.0" y="190.25" text-anchor="middle" style="font-size:15px">Molecule</text><path class="d-arrow" d="M510 185H534" marker-end="url(#dah-w)"/><rect class="d-box d-atom" x="536" y="159" width="90" height="52" rx="12"/><text class="d-text" x="581.0" y="190.25" text-anchor="middle" style="font-size:15px">Atom</text><path class="d-arrow" d="M626 185H748" marker-end="url(#dah-w)"/><path class="d-arrow" d="M128 262H162" marker-end="url(#dah-w)"/><rect class="d-box d-page" x="164" y="236" width="90" height="52" rx="12"/><text class="d-text" x="209.0" y="267.25" text-anchor="middle" style="font-size:15px">Page</text><path class="d-arrow" d="M254 262H282" marker-end="url(#dah-w)"/><rect class="d-box d-org" x="284" y="236" width="100" height="52" rx="12"/><text class="d-text" x="334.0" y="267.25" text-anchor="middle" style="font-size:15px">Organism</text><path class="d-arrow" d="M384 262H408" marker-end="url(#dah-w)"/><rect class="d-box d-mol" x="410" y="236" width="100" height="52" rx="12"/><text class="d-text" x="460.0" y="267.25" text-anchor="middle" style="font-size:15px">Molecule</text><path class="d-arrow" d="M510 262H534" marker-end="url(#dah-w)"/><rect class="d-box d-atom" x="536" y="236" width="90" height="52" rx="12"/><text class="d-text" x="581.0" y="267.25" text-anchor="middle" style="font-size:15px">Atom</text><path class="d-arrow" d="M626 262H748" marker-end="url(#dah-w)"/><path class="d-arrow" d="M128 339H162" marker-end="url(#dah-w)"/><rect class="d-box d-page" x="164" y="313" width="90" height="52" rx="12"/><text class="d-text" x="209.0" y="344.25" text-anchor="middle" style="font-size:15px">Page</text><path class="d-arrow" d="M254 339H282" marker-end="url(#dah-w)"/><rect class="d-box d-org" x="284" y="313" width="100" height="52" rx="12"/><text class="d-text" x="334.0" y="344.25" text-anchor="middle" style="font-size:15px">Organism</text><path class="d-arrow" d="M384 339H408" marker-end="url(#dah-w)"/><rect class="d-box d-mol" x="410" y="313" width="100" height="52" rx="12"/><text class="d-text" x="460.0" y="344.25" text-anchor="middle" style="font-size:15px">Molecule</text><path class="d-arrow" d="M510 339H534" marker-end="url(#dah-w)"/><rect class="d-box d-atom" x="536" y="313" width="90" height="52" rx="12"/><text class="d-text" x="581.0" y="344.25" text-anchor="middle" style="font-size:15px">Atom</text><path class="d-arrow" d="M626 339H748" marker-end="url(#dah-w)"/><rect class="d-box d-ui" x="750" y="130" width="130" height="270" rx="18"/><text class="d-title" x="815" y="156" text-anchor="middle" style="font-size:15px">User interface</text><rect class="d-box d-card" x="770" y="175" width="90" height="36" rx="8"/><rect class="d-box d-card" x="770" y="252" width="90" height="36" rx="8"/><rect class="d-box d-card" x="770" y="329" width="90" height="36" rx="8"/><text class="d-note" x="660" y="168" text-anchor="middle" style="font-size:13px">render</text><path class="d-arrow" d="M815 400V452H420V436" marker-end="url(#dah-w)"/><text class="d-note" x="640" y="444" text-anchor="middle" style="font-size:13px">user actions, mutations</text></svg><svg class="narrow" viewBox="0 0 340 520" role="img" aria-labelledby="dn-t dn-d"><title id="dn-t">Front-end architecture</title><desc id="dn-d">The router picks a page. Each page, which can reach the API through the network layer, composes organisms from molecules and atoms. The result goes to the user interface, and user actions go back to the network layer, which talks to the GraphQL API.</desc><defs><marker id="dah-n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M1 1L9 5L1 9z"/></marker></defs><rect class="d-box d-api" x="90" y="8" width="160" height="38" rx="12"/><text class="d-text" x="170.0" y="32.25" text-anchor="middle" style="font-size:15px">GraphQL API</text><path class="d-arrow" d="M140 46V86" marker-end="url(#dah-n)"/><path class="d-arrow" d="M200 88V48" marker-end="url(#dah-n)"/><text class="d-note" x="132" y="72" text-anchor="end" style="font-size:12px">queries</text><text class="d-note" x="208" y="72" text-anchor="start" style="font-size:12px">data</text><rect class="d-layer" x="8" y="88" width="324" height="292" rx="16"/><text class="d-title" x="20" y="112" style="font-size:13px">Network layer · API access</text><rect class="d-box " x="34" y="128" width="56" height="34" rx="10"/><text class="d-text" x="62.0" y="149.2" text-anchor="middle" style="font-size:12px">Router</text><path class="d-line" d="M34 145H20V328"/><path class="d-arrow" d="M20 208H32" marker-end="url(#dah-n)"/><rect class="d-box d-page" x="34" y="189" width="56" height="38" rx="10"/><text class="d-text" x="62.0" y="212.2" text-anchor="middle" style="font-size:12px">Page</text><path class="d-arrow" d="M90 208H106" marker-end="url(#dah-n)"/><rect class="d-box d-org" x="108" y="189" width="56" height="38" rx="10"/><text class="d-text" x="136.0" y="211.85" text-anchor="middle" style="font-size:11px">Organism</text><path class="d-arrow" d="M164 208H180" marker-end="url(#dah-n)"/><rect class="d-box d-mol" x="182" y="189" width="56" height="38" rx="10"/><text class="d-text" x="210.0" y="211.85" text-anchor="middle" style="font-size:11px">Molecule</text><path class="d-arrow" d="M238 208H254" marker-end="url(#dah-n)"/><rect class="d-box d-atom" x="256" y="189" width="56" height="38" rx="10"/><text class="d-text" x="284.0" y="212.2" text-anchor="middle" style="font-size:12px">Atom</text><path class="d-arrow" d="M20 268H32" marker-end="url(#dah-n)"/><rect class="d-box d-page" x="34" y="249" width="56" height="38" rx="10"/><text class="d-text" x="62.0" y="272.2" text-anchor="middle" style="font-size:12px">Page</text><path class="d-arrow" d="M90 268H106" marker-end="url(#dah-n)"/><rect class="d-box d-org" x="108" y="249" width="56" height="38" rx="10"/><text class="d-text" x="136.0" y="271.85" text-anchor="middle" style="font-size:11px">Organism</text><path class="d-arrow" d="M164 268H180" marker-end="url(#dah-n)"/><rect class="d-box d-mol" x="182" y="249" width="56" height="38" rx="10"/><text class="d-text" x="210.0" y="271.85" text-anchor="middle" style="font-size:11px">Molecule</text><path class="d-arrow" d="M238 268H254" marker-end="url(#dah-n)"/><rect class="d-box d-atom" x="256" y="249" width="56" height="38" rx="10"/><text class="d-text" x="284.0" y="272.2" text-anchor="middle" style="font-size:12px">Atom</text><path class="d-arrow" d="M20 328H32" marker-end="url(#dah-n)"/><rect class="d-box d-page" x="34" y="309" width="56" height="38" rx="10"/><text class="d-text" x="62.0" y="332.2" text-anchor="middle" style="font-size:12px">Page</text><path class="d-arrow" d="M90 328H106" marker-end="url(#dah-n)"/><rect class="d-box d-org" x="108" y="309" width="56" height="38" rx="10"/><text class="d-text" x="136.0" y="331.85" text-anchor="middle" style="font-size:11px">Organism</text><path class="d-arrow" d="M164 328H180" marker-end="url(#dah-n)"/><rect class="d-box d-mol" x="182" y="309" width="56" height="38" rx="10"/><text class="d-text" x="210.0" y="331.85" text-anchor="middle" style="font-size:11px">Molecule</text><path class="d-arrow" d="M238 328H254" marker-end="url(#dah-n)"/><rect class="d-box d-atom" x="256" y="309" width="56" height="38" rx="10"/><text class="d-text" x="284.0" y="332.2" text-anchor="middle" style="font-size:12px">Atom</text><path class="d-arrow" d="M130 380V436" marker-end="url(#dah-n)"/><text class="d-note" x="122" y="414" text-anchor="end" style="font-size:12px">render</text><path class="d-arrow" d="M210 436V382" marker-end="url(#dah-n)"/><text class="d-note" x="218" y="414" text-anchor="start" style="font-size:12px">user actions</text><rect class="d-box d-ui" x="60" y="438" width="220" height="70" rx="14"/><text class="d-title" x="170" y="465" text-anchor="middle" style="font-size:14px">User interface</text><rect class="d-box d-card" x="90" y="476" width="52" height="20" rx="6"/><rect class="d-box d-card" x="152" y="476" width="52" height="20" rx="6"/><rect class="d-box d-card" x="214" y="476" width="52" height="20" rx="6"/></svg><figcaption>How a request moves through the app: the router picks a page, the page reaches the API through the network layer and composes organisms, molecules and atoms, and the user interface sends actions back the same way.</figcaption></figure>

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
Structuring your app might be quite complex task, many thing needs to be considered and tradeoffs mist be measured carefully, having some opinionated approach is essential to keep things moving forward. Just try to keep things simple as much as possible – most of our time we are reading code rather that writing it, that’s why it is very important to keep things organised to reduce cognitive load on developers and let them focus on solving business problems rather than arguing about libs to use or styles to apply.
