import icon from '../images/icon.png';
import styles from '../styles/Home.module.css';

function Home() {
    return (
        <div className={styles.homeContainer}>
            <div className={styles.introContainer}>
                <h1>ed2gether</h1>
                <p>where every voice learns, connects, and belongs</p>
            </div>
            <div className={styles.imageContainer}>
                <img src={icon} className={styles.image}></img>
            </div>
        </div>
    );
}

export default Home;