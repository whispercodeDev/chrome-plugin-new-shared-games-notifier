I want to create a chrome plugin that notifies me about new shared games on steam in my steam family.

The access token is obtained via this api: https://store.steampowered.com/pointssummary/ajaxgetasyncconfig
The user needs to be logged in to steam.
This api returns a json object with a key "access_token" which is the access token, e.g.

````json
{"success":1,"data":{"webapi_token":"eyAidHlwIjogIkpXVCIsICJhbGciOiAiRWREU0EiIH0.eyAiaXNzIjogInI6MDAwRV8yNTdCREExNF9FN0MxQiIsICJzdWIiOiAiNzY1NjExOTc5NzM0NjIzMTAiLCAiYXVkIjogWyAid2ViOnN0b3JlIiBdLCAiZXhwIjogMTczNTM4NjQwMCwgIm5iZiI6IDE3MjY2NTkwMzUsICJpYXQiOiAxNzM1Mjk5MDM1LCAianRpIjogIjAwMDhfMjU4RTEzMTVfQzJBRDEiLCAib2F0IjogMTczMzU2ODUyNiwgInJ0X2V4cCI6IDE3NTE2ODE4ODgsICJwZXIiOiAwLCAiaXBfc3ViamVjdCI6ICI5My4yMTguMjA2Ljc4IiwgImlwX2NvbmZpcm1lciI6ICI5My4yMTguMjA2Ljc4IiB9.Za99VhaK5f2E4-JfSi1zArALl1OI_b8qAkgZWrxSVMySEaHLBgP2Gd0gk-0cFVexG2quEoVfFVvCxlDob3NGBQ"}}```



The games are requested via this api: https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?access_token=<my_access_token>&family_groupid=0&include_own=true&include_excluded=true&include_free=true&include_non_games=true
This api returns a json object with a key "response" which contains an array of games, e.g.

```json
{
  "response": {
    "apps": [
      {
        "appid": 10,
        "owner_steamids": ["76561197973462310"],
        "name": "Counter-Strike",
        "capsule_filename": "library_600x900.jpg",
        "img_icon_hash": "6b0312cda02f5f777efa2f3318c307ff9acafbb5",
        "exclude_reason": 0,
        "rt_time_acquired": 1460785981,
        "rt_last_played": 1684625840,
        "rt_playtime": 15005,
        "app_type": 1,
        "content_descriptors": [2, 5]
      },
      {
        "appid": 20,
        "owner_steamids": ["76561197973462310"],
        "name": "Team Fortress Classic",
        "capsule_filename": "library_600x900.jpg",
        "img_icon_hash": "38ea7ebe3c1abbbbf4eabdbef174c41a972102b9",
        "exclude_reason": 0,
        "rt_time_acquired": 1106423828,
        "rt_last_played": 1590133303,
        "rt_playtime": 1,
        "app_type": 1,
        "content_descriptors": [2, 5]
      },
    ]
  }
}
````

For the check of new shared games, check if the property "rt_last_played" is greater than the last time you checked.

Check the "rt_last_played" property for each game in the response. If it is greater than the last time you checked, notify the user.

The notification should be a popup in the top right corner of the screen. The popup should have the game name and say "New game shared: <game name>"

The popup should be persistent until the user clicks on it.

The popup should have a button to open the game in steam.

The popup should have a button to close the popup.

The popup should have a button to open the steam family page in a new tab.
