# Changelog

## [1.1.0](https://github.com/governify-next/scope-manager/compare/v1.0.0...v1.1.0) (2026-09-14)


### Features

* add createdBy field to scopes and update related services and documentation ([bdf75c1](https://github.com/governify-next/scope-manager/commit/bdf75c115ecb5aa23823098a6928191a78725aa0))
* add support for flat response in getScopesByOrganization ([f3d61c3](https://github.com/governify-next/scope-manager/commit/f3d61c3910161f1e8db00b8c0e851d54d8d9d427))
* change scope api to use ids ([c6f7537](https://github.com/governify-next/scope-manager/commit/c6f75378364fe22e9613249c78fae34ac1aec4c5))
* enhance role-based access control by adding SUPERADMIN role and priority handling ([1bdbfdd](https://github.com/governify-next/scope-manager/commit/1bdbfdd744707a23e1dd81d00446e3b69c797ee8))
* enhance scope validation and model to require parentId ([bbadba3](https://github.com/governify-next/scope-manager/commit/bbadba33ae5f28a3eb38c7244c68df00436bec32))
* get organizations where user belongs ([f9b990c](https://github.com/governify-next/scope-manager/commit/f9b990c7f018efb17a324868d17214ee0a97f8b4))
* get organizations where user belongs ([ffd2987](https://github.com/governify-next/scope-manager/commit/ffd29870e146e4061eec2a08babfef316be43c69))
* update organization and scope routes to require SUPERADMIN role for access ([3c37dfe](https://github.com/governify-next/scope-manager/commit/3c37dfeef787c79a358c8bf911b0b5b534a79d53))


### Bug Fixes

* allow services (join) to read organizations ([9e6d8a9](https://github.com/governify-next/scope-manager/commit/9e6d8a9935e3c9346a6e8a1b27f7aa8a427cc7b5))
* allow services on routes ([7d29328](https://github.com/governify-next/scope-manager/commit/7d29328fb0eb8e0a65baf1855be8aa3ff3865cd2))
* enable authentication for org route ([1c2bfd9](https://github.com/governify-next/scope-manager/commit/1c2bfd9f54ae9e2721d77f7d11965dfea55b8a25))
* make config field mandatory ([21fc264](https://github.com/governify-next/scope-manager/commit/21fc2641a16713007797777b4aeb32fe720d5b5c))
* preserve organization object id type ([bc815e3](https://github.com/governify-next/scope-manager/commit/bc815e3a0c3fd37e9d67b183471b6cde7fdfbeb3))
* routes permissions for registry integration ([9a0ab3d](https://github.com/governify-next/scope-manager/commit/9a0ab3d798e8ebcd7255034ba09939fd11a9f058))
* **scopes:** allow service tree creation ([48fca3f](https://github.com/governify-next/scope-manager/commit/48fca3fb3febd482312013ff86fd949034fd3c76))
* **scopes:** allow service-authenticated scope creation ([dcad370](https://github.com/governify-next/scope-manager/commit/dcad37086d12096df2c9db73263bbdb6708c914e))
* service authentication with token fetching and header generation ([d51b8b7](https://github.com/governify-next/scope-manager/commit/d51b8b734c6990688446ecb6a19681dcf7f0df40))
* temporally solution to jwt in scope ([b522280](https://github.com/governify-next/scope-manager/commit/b522280e4e937b49114a2baaa0448263b60cf798))
* update package-lock.json ([aefbb8a](https://github.com/governify-next/scope-manager/commit/aefbb8a0a7f90b8dbd97cd4eb073fd6c69102661))
* update package.json to reflect correct project name and repository URLs ([b1f52d0](https://github.com/governify-next/scope-manager/commit/b1f52d09d173714b949bfa7eb01f32606043d200))


### Miscellaneous Chores

* prepare v1.1.0 release ([1c8f691](https://github.com/governify-next/scope-manager/commit/1c8f691bc0b3114273d859ba1a889e492f492aeb))
* release 1.1.0 ([fdafd4f](https://github.com/governify-next/scope-manager/commit/fdafd4f85f894494f937b925182095748e228d50))

## 1.0.0 (2026-05-20)

### Features

- add Docker workflow for automated builds and pushes on develop branch ([0ef6d92](https://github.com/governify-next/scope-manager/commit/0ef6d92d161dfbe606a63d30f4e2c34eb29b43b1))
- first release ([afb616f](https://github.com/governify-next/scope-manager/commit/afb616f9a48d368b4a26b6cf7801d2562977ac8a))
- implement service authentication middleware and update related configurations ([f39e606](https://github.com/governify-next/scope-manager/commit/f39e60665a6000b3badad526e35b61c9120a4475))
- **OIDC:** error handling ([6057da4](https://github.com/governify-next/scope-manager/commit/6057da495f72d9a32a97d8ac44560ad061ad0eca))
- release action workflow ([bf4bad8](https://github.com/governify-next/scope-manager/commit/bf4bad80a61a117ef09027247db1e096197b7572))
- user authentication, env vars, mongo, fix swager, logger ([032fe14](https://github.com/governify-next/scope-manager/commit/032fe14607ef053768b07e5977379067531855c0))

### Bug Fixes

- add security requirements for organization routes ([5a3e9e8](https://github.com/governify-next/scope-manager/commit/5a3e9e8d9222b5c528fd34945fc526d745e05a85))
- handle missing host header in OIDC callback ([bcadf8f](https://github.com/governify-next/scope-manager/commit/bcadf8f64d864a08bb2451911fa5041268066ba8))
- **OIDC:** callback endpoint type ([ba3fb71](https://github.com/governify-next/scope-manager/commit/ba3fb710dbcee163b9b0b84a776bebfb8eecc7aa))
- **OIDC:** correct callback endpoint in default env ([d067b77](https://github.com/governify-next/scope-manager/commit/d067b7705e391265d922f22820504dd74e1c4b21))
- **OIDC:** email claim name ([2bce5ac](https://github.com/governify-next/scope-manager/commit/2bce5ac25bbf8e34f05d809e9deb9453b06ac43d))
- **OIDC:** force https callback url ([50f2f74](https://github.com/governify-next/scope-manager/commit/50f2f747a528d808b0779226b8726186e74c5049))
- **OIDC:** unnecessary nested object ([719fcb3](https://github.com/governify-next/scope-manager/commit/719fcb37514a5f1970d584a7646b4cac2fd86f6b))
- update Docker image tag to governifynext/scope-manager:develop ([3139087](https://github.com/governify-next/scope-manager/commit/31390873a5089e8aee3305917e3ebf4e134db5fb))
- update PORT configuration to 5901 ([372496b](https://github.com/governify-next/scope-manager/commit/372496b25a0950adc9bba3926a3fd6217d183e0d))
