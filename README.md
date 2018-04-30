# Mobile Web Specialist Certification Course
---

## Stage 1

### Issues that should be fixed after the first review:

- [x] Select options combo lists weren't usable on smaller screens
- [x] The div with an id of "map" needed an appropiate aria role ( "application" )
- [x] The "breadcrumb" list wasn't compatible with aria structure

### Updates added to the project:

| Fixes |  corresponding commit links |
| ----- |  ----- |
| Select lists are now rendered properly on small screens |  https://github.com/chnebx/mws-restaurant-stage-1/commit/bf95dfa62a311c5f553fab035fd55e2e546efaef |
| The div area for the map gets an aria-role of "application" on both index and restaurant html pages |  https://github.com/chnebx/mws-restaurant-stage-1/commit/bf95dfa62a311c5f553fab035fd55e2e546efaef |
| The breadcrumb list has been changed from a ul to an ol and should now get a proper structure |  https://github.com/chnebx/mws-restaurant-stage-1/commit/49f7224c19d09fc299b590eb0659c0398a39a1fe |

## Stage 2 

Branch Tooling indications :

Starting the Project :
> 'npm install' ( in the root folder )
> type gulp
> check localhost:5000