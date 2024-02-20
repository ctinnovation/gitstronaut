![gitstronaut logo](gitstronaut.jpg)

## Gitstronaut

Have a lot of packages on your GitHub account? Explore them smoothly with gitstronaut 🚀

### Authentication

There are two ways to authenticate with this CLI:

- By passing an argument `--token -t` with a (personal or fine-grained) access token from GitHub (required at least read access to repositories and contents)
- If not passing any `--token` argument you will required to grant access to this CLI through your browser with a device code, follow the istructions on your cool terminal

### Explore

Usage:

```bash
gitstronaut explore [--ARGS]
```

With explore, for each repository, gitstronaut will give you information about:

- Branches: warning you about un-protected and pending branches
- Pull requests: warning you about Pull Requests that are open and not merged
- Tags: warning you when the default branch is not aligned with the latest tag (and how many commits are between the two)

If you're using [changelogger](https://github.com/ctinnovation/changelogger) for handling your CHANGELOGs gitstronaut will also hint you the likely next release needed for that repo.


### Tags

Usage: 

```bash
gitstronaut tags [--ARGS]
```

With tags command gitstraonaut will summarize the latest tag for each repo and if the default branch is aligned with it or not.


### Arguments

| Argument           | Description                                             | Type                       |
| ------------------ | ------------------------------------------------------- | -------------------------- |
| -f, --filter       | Explore repositories with this filter (RegExp accepted) |                            |
| -o, --organization | Explore repositories whitin orgaizationb                | [string]                   |
| --showUrls         | Show URL of referred data (more verbose)                | [boolean] [default: false] |
| -t, --token        | Token for access to GitHub                              | [string]                   |
| --help             | Show help                                               | [boolean]                  |
| --version          | Show version number                                     | [boolean]                  |