import { useEffect, useState } from 'react';
import { Button, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const App = () => {
  /* Initializing state using the useState hook to keep track of changes to the search bar. pokemonList displays the results of the search as well as the initial list of 151. SelectedPokemon keeps address the pokemon selected for the details, and renamedPokemon initializes as an object to hold the key/value pairing of the original pokemon's name and its new name. isRenaming acts as a toggle to render the renaming textInput for each pokemon.
  */
  const [search, setSearch] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [renamedPokemon, setRenamedPokemon] = useState({});
  const [isRenaming, setIsRenaming] = useState(false);

  const fetchPokemonList = async () => {
    /* Using the fetch API to get the initial 151 pokemon from the pokeAPI. Paired with the useEffect hook with an empty dependency array so that it runs only on the initial render.
    */
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      const pokemonData = await response.json();
      setPokemonList(pokemonData.results);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const fetchPokemonDetails = async (name) => {
    /* Fetching specific Pokemon details to display when a name is selected. Also added functionality to display details of the first pokemon in the list of search results.
    */
    try {
      const detailsResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const pokemon = await detailsResponse.json();
      setSelectedPokemon(pokemon);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const searchPokemon = async (search) => {
    try {
    /* Fetches the original 151 pokemon and maps them into an array of objects that pair the pokemon with either their original name, or new name, as the displayName property. In future iterations, I'd refactor this function to reduce the use of map, filter, and for loops to improve time complexity and use of resources.
    */
      const searchResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=151`);
      const searchData = await searchResponse.json();
      const searchResults = searchData.results;
      const displayNameResults = searchResults.map((pokemon) => {
        const renamedName = renamedPokemon[pokemon.name];
        const displayName = renamedName || pokemon.name;
        return { ...pokemon, displayName };
      });

      const filteredPokemon = displayNameResults.filter((pokemon) =>
      /* Filters the results list by the checking if the display name contains the search characters. Used toLowerCase() to allow non-case-senstive substrings to appear in results. Added logical operator so both the pokemon's original name and new name can be found in the search results.
      */
        pokemon.displayName.toLowerCase().includes(search.toLowerCase()) ||
        pokemon.name.toLowerCase().includes(search.toLowerCase())
      );

      if (filteredPokemon) {
      /* Gets the details of each pokemon in the filtered list and pushes them into a new array that is then sorted by a function that moves renamed pokemon to the top of search results they appear in.
      */
        let pokeArr = [];
        for (let poke of filteredPokemon) {
          const pokemonResponse = await fetch(poke.url);
          const pokemonData = await pokemonResponse.json();
          pokeArr.push(pokemonData)
        }
        setPokemonList(pokeArr);
        if (search !== '')
        pokeArr.sort(sortPokemon);
        // added feature that automatically displays the first pokemon in the search results.
        fetchPokemonDetails(pokeArr[0].name)
        // reset search text input after successfully searching
        setSearch('');
      } else {
        setPokemonList([]);
      }
    } catch (error) {
      console.error('Error', error)
    }
  };

  const renamePokemon = (name, newName) => {
    // establishes pairing a pokemon's original name with a new name that is stored in memory
    setRenamedPokemon({ ...renamedPokemon, [name]: newName });
  };

  const sortPokemon = (a, b) => {
    // sorts pokemon list so renamed pokemon appear at the top of search results
    if (renamedPokemon[a.name]) {
      return -1;
    }
    if (renamedPokemon[b.name]) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  };

  const renderPokemonList = ({ item }) => {
    /* renders PokemonList by displayName and uses touchableOpacity to allow users to click on a name to display the pokemon's details.
    */
    const renamedName = renamedPokemon[item.name];
    const displayName = renamedName || item.name;
    return (
      <TouchableOpacity onPress={() => fetchPokemonDetails(item.name)}>
        <View style={styles.pokemonList}>
          <Text style={styles.pokemonListName}>{displayName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPokemon = () => {
    // renders pokemon detail information such as image, height, weight and types. In future iterations, I'd add more pokemon details and styling here and ideally would like the cry of the pokemon to play when it renders on screen.
    if (selectedPokemon) {
      const renamedName = renamedPokemon[selectedPokemon.name];
      const displayName = renamedName || selectedPokemon.name;
      return (
        <View style={styles.pokemonDetailContainer}>
          <Image
            style={styles.pokemonImage}
            source={{ uri: selectedPokemon.sprites.front_default }}
          />
          {isRenaming && <TextInput
          /* conditionally renders the renaming textInput based on the state of isRenaming, which is toggled by clicking on the name of the pokemon, and reset by a useEffect hook with a dependency of selectedPokemon, so on selection of a new pokemon the rename textInput disappears and is reset when the new pokemon's name is clicked.
          */
            style={styles.renameInput}
            onChangeText={(newName) => renamePokemon(selectedPokemon.name, newName)}
            value={renamedPokemon[selectedPokemon.name]}
            autoCapitalize='none'
            placeholder="Rename Pokémon"
          />}
          <TouchableOpacity onPress={() => setIsRenaming(!isRenaming)}>
            <Text style={styles.pokemonName}>{displayName}</Text>
          </TouchableOpacity>
          <View style={styles.typesContainer}>
            {selectedPokemon.types.map((type, index) => (
              <Text key={index} style={styles.type}>
                {type.type.name}
              </Text>
            ))}
          </View>
          <Text style={styles.pokemonDetailText}>
            Height: {selectedPokemon.height}
          </Text>
          <Text style={styles.pokemonDetailText}>
            Weight: {selectedPokemon.weight}
          </Text>
        </View>
      );
    }
    return null;
  };

  useEffect(() => {
    // Initializes list of 151 pokemon on the first render
    fetchPokemonList();
  }, []);

  useEffect(() => {
    // Resets and unmounts the renaming text input when a new pokemon is selected
    setIsRenaming(false);
  }, [selectedPokemon]);

  return (
    /* Structured to display the original 151 pokemon, or search results in 3 columns with the pokemon details at the top of the page. Something I would change on future iterations is separating the list from the details in a more elegant and user-friendly way. Perhaps in a way that looked similar to an actual Pokedex? 
    */
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          onChangeText={setSearch}
          value={search}
          // Added feature that searches on pressing Enter key from the search bar
          onSubmitEditing={() => {
            searchPokemon(search);
          }}
          autoCapitalize='none'
          placeholder="Search Pokémon"
        />
        <Button title="Search" onPress={() => searchPokemon(search)} />
      </View>
      <ScrollView style={styles.resultContainer}>
        {renderPokemon()}
        {pokemonList.length > 0 && (
          <View style={styles.pokemonListContainer}>
            <FlatList
              numColumns={3}
              data={pokemonList}
              renderItem={renderPokemonList}
              keyExtractor={(item) => item.name}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// In future iterations, I'd certainly add more styling to the application, ideally for the true pokedex look. Adding colors to distinguish pokemon types and perhaps tie that color to the pokemon's name display. Overall a project with a lot of potential to flesh out and make great one day.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    overflow: 'scroll',
    alignItems: 'center',
    marginTop: Platform.OS !== 'web' ? 40 : 0
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderColor: 'gray',
    borderWidth: 1,
    marginRight: 10,
  },
  resultContainer: {
    alignItems: 'center',
  },
  pokemonDetailContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  pokemonImage: {
    width: 300,
    height: 300,
  },
  pokemonList: {
    borderWidth: 1,
    width: 80,
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 10,
    marginRight: 10
  },
  pokemonListName: {
    fontSize: 12,
    marginBottom: 10,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  typesContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  type: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 5,
  },
  renameInput: {
    textAlign: 'center',
    color: 'grey'
  },
  pokemonListContainer: {
    alignItems: 'center'
  }
})

export default App;
